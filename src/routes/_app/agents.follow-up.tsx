import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Bell, Sparkles, Loader2, Radio, ArrowLeft, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { leadsQuery, type Lead } from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import { sendFollowUp } from "../../lib/follow-up-ai.functions";
import { relativeTime } from "../../lib/format";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/agents/follow-up")({
  head: () => ({ meta: [{ title: "Follow-Up AI Agent | USTDTS CRM" }] }),
  component: FollowUpAgentPage,
});

type LogRow = { id: string; name: string; action: string; ts: string; sms?: string };

function isStale(l: Lead): boolean {
  const closed = ["enrolled", "won", "rejected", "lost"];
  if (closed.includes(l.status)) return false;
  const hours = (Date.now() - new Date(l.updated_at ?? l.created_at).getTime()) / 3600000;
  // "Stale" = new lead > 6h old, or contacted lead > 48h with no reply.
  if (l.status === "new") return hours >= 6;
  if (l.status === "contacted") return hours >= 48;
  return hours >= 24;
}

function FollowUpAgentPage() {
  const leadsQ = useQuery(leadsQuery);
  const qc = useQueryClient();
  const run = useServerFn(sendFollowUp);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogRow[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("followup-agent-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (p) => {
          const n = p.new as Lead;
          const o = p.old as Lead;
          if (o.status !== "contacted" && n.status === "contacted") {
            setLog((prev) =>
              [
                { id: n.id, name: n.full_name, action: "Follow-up SMS sent", ts: new Date().toISOString(), sms: n.message ?? undefined },
                ...prev,
              ].slice(0, 30),
            );
          }
          qc.invalidateQueries({ queryKey: ["leads"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const leads = leadsQ.data ?? [];
  const queue = useMemo(() => leads.filter(isStale).slice(0, 40), [leads]);
  const contactedToday = useMemo(() => {
    const day = Date.now() - 86400000;
    return leads.filter(
      (l) => l.status === "contacted" && new Date(l.updated_at ?? l.created_at).getTime() > day,
    ).length;
  }, [leads]);
  const totalContacted = leads.filter((l) => l.status === "contacted").length;
  const openStale = queue.length;

  async function runQueue() {
    const targets = queue.slice(0, 8);
    if (targets.length === 0) return toast.info("No stale leads to follow up on.");
    setRunning(true);
    toast.info(`Follow-Up AI reaching out to ${targets.length}…`);
    for (const l of targets) {
      try {
        const res = await run({ data: { leadId: l.id } });
        setLog((prev) =>
          [
            { id: l.id, name: l.full_name, action: "Drafted + sent SMS", ts: new Date().toISOString(), sms: res.sms },
            ...prev,
          ].slice(0, 30),
        );
      } catch (e) {
        setLog((prev) =>
          [
            { id: l.id, name: l.full_name, action: `Failed: ${e instanceof Error ? e.message : "error"}`, ts: new Date().toISOString() },
            ...prev,
          ].slice(0, 30),
        );
      }
    }
    await qc.invalidateQueries({ queryKey: ["leads"] });
    setRunning(false);
    toast.success("Follow-Up AI run complete.");
  }

  return (
    <div className="dark cc-shell -m-4 min-h-screen rounded-none p-4 text-foreground lg:-m-8 lg:p-8">
      <div className="space-y-6 pb-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Control Center
        </Link>

        <div className="cc-card-glow rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                <Bell className="h-7 w-7" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-success">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Active · Watching for stale leads
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold">Follow-Up AI</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Scans the leads table for prospects that have gone quiet, drafts a personalized SMS through Gemini,
                  marks the lead as contacted, and stores the exact message on the lead record.
                </p>
              </div>
            </div>
            <Button onClick={runQueue} disabled={running} className="gap-2">
              {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Sparkles className="h-4 w-4" /> Follow up on {Math.min(queue.length, 8)}</>}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Stale leads waiting" value={openStale} tone="warning" />
          <Stat label="Follow-ups sent (24h)" value={contactedToday} tone="info" />
          <Stat label="Total contacted" value={totalContacted} />
          <Stat label="Recovery rate target" value={"35%"} tone="info" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-success" />
              <h2 className="font-display text-sm font-bold">Live outbound activity</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-success">Realtime</span>
            </div>
            {log.length === 0 ? (
              <p className="text-xs text-muted-foreground">Waiting for the next follow-up run…</p>
            ) : (
              <ul className="space-y-2">
                {log.map((row, i) => (
                  <li key={`${row.id}-${i}`} className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground">{row.name}</div>
                        <div className="text-[11px] text-muted-foreground">{row.action}</div>
                        {row.sms && (
                          <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-border/40 bg-background/60 p-2 text-[11px] text-foreground/80">
                            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                            <span className="whitespace-pre-wrap">{row.sms}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{relativeTime(row.ts)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-info" />
              <h2 className="font-display text-sm font-bold">Queue · stale leads</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">{queue.length} waiting</span>
            </div>
            {queue.length === 0 ? (
              <p className="text-xs text-muted-foreground">No stale leads. Everyone in the pipeline has been touched recently.</p>
            ) : (
              <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {queue.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-foreground">{l.full_name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {l.program ?? "Undecided"} · {l.status} · last touch {relativeTime(l.updated_at ?? l.created_at)}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-warning">Stale</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="cc-card rounded-2xl p-5">
          <h2 className="mb-3 font-display text-sm font-bold">How this agent works</h2>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li><span className="font-semibold text-foreground">1. Watch.</span> Continuously scans <code className="text-accent">public.leads</code> for prospects with no touch in 6h (new) or 48h (contacted).</li>
            <li><span className="font-semibold text-foreground">2. Draft.</span> Calls Gemini via the Lovable AI Gateway with the lead's program, source, and last message to generate a personalized SMS under 320 chars.</li>
            <li><span className="font-semibold text-foreground">3. Send.</span> Writes the message back onto the lead row and flips status to <code className="text-accent">contacted</code> — the same update surfaces in realtime on the Admissions AI feed.</li>
            <li><span className="font-semibold text-foreground">4. Loop.</span> Any lead that goes quiet again re-enters the queue automatically.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "warning" | "info" }) {
  const cls = tone === "warning" ? "text-warning" : tone === "info" ? "text-info" : "text-foreground";
  return (
    <div className="cc-card rounded-2xl p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
