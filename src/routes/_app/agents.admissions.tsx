import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  UserCheck,
  Sparkles,
  Loader2,
  Radio,
  Inbox,
  MessageSquare,
  FileText,
  ArrowLeft,
  Flame,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { leadsQuery, type Lead } from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import { analyzeLead } from "../../lib/crm-ai.functions";
import { leadTemperature } from "../../lib/dashboard-metrics";
import { relativeTime } from "../../lib/format";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/agents/admissions")({
  head: () => ({ meta: [{ title: "Admissions AI Agent | USTDTS CRM" }] }),
  component: AdmissionsAgentPage,
});

function AdmissionsAgentPage() {
  const leadsQ = useQuery(leadsQuery);
  const qc = useQueryClient();
  const run = useServerFn(analyzeLead);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<
    { id: string; name: string; action: string; ts: string; intent?: string }[]
  >([]);

  // Realtime: any new lead is a live intake event handled by this agent.
  useEffect(() => {
    const channel = supabase
      .channel("admissions-agent-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const l = payload.new as Lead;
          setLog((prev) =>
            [
              {
                id: l.id,
                name: l.full_name,
                action: `Intake received from ${l.source}`,
                ts: new Date().toISOString(),
              },
              ...prev,
            ].slice(0, 30),
          );
          qc.invalidateQueries({ queryKey: ["leads"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        () => qc.invalidateQueries({ queryKey: ["leads"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const leads = leadsQ.data ?? [];

  const stats = useMemo(() => {
    const bySource: Record<string, number> = {};
    let unscored = 0;
    let hot = 0;
    let warm = 0;
    let cold = 0;
    let last24 = 0;
    const dayAgo = Date.now() - 86400000;
    for (const l of leads) {
      bySource[l.source] = (bySource[l.source] ?? 0) + 1;
      if (!l.score || l.score === 50) unscored += 1;
      const t = leadTemperature(l.score);
      if (t === "hot") hot += 1;
      else if (t === "warm") warm += 1;
      else cold += 1;
      if (new Date(l.created_at).getTime() > dayAgo) last24 += 1;
    }
    return { bySource, unscored, hot, warm, cold, last24, total: leads.length };
  }, [leads]);

  const pending = useMemo(
    () => leads.filter((l) => l.status === "new" || l.status === "contacted").slice(0, 40),
    [leads],
  );

  async function autoQualify() {
    const targets = pending.slice(0, 10);
    if (targets.length === 0) {
      toast.info("No pending leads to qualify.");
      return;
    }
    setRunning(true);
    toast.info(`Admissions AI qualifying ${targets.length} lead${targets.length > 1 ? "s" : ""}…`);
    for (const l of targets) {
      try {
        const res = await run({
          data: {
            id: l.id,
            full_name: l.full_name,
            email: l.email,
            phone: l.phone,
            program: l.program,
            message: l.message,
            status: l.status,
            score: l.score,
            source: l.source,
          },
        });
        setLog((prev) =>
          [
            {
              id: l.id,
              name: l.full_name,
              action: `Qualified as ${res.intent.toUpperCase()} · ${res.next_action}`,
              ts: new Date().toISOString(),
              intent: res.intent,
            },
            ...prev,
          ].slice(0, 30),
        );
      } catch (e) {
        setLog((prev) =>
          [
            {
              id: l.id,
              name: l.full_name,
              action: `Failed: ${e instanceof Error ? e.message : "error"}`,
              ts: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 30),
        );
      }
    }
    await qc.invalidateQueries({ queryKey: ["leads"] });
    setRunning(false);
    toast.success("Admissions AI run complete.");
  }

  return (
    <div className="dark cc-shell -m-4 min-h-screen rounded-none p-4 text-foreground lg:-m-8 lg:p-8">
      <div className="space-y-6 pb-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Control Center
        </Link>

        {/* Header */}
        <div className="cc-card-glow rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 text-success">
                <UserCheck className="h-7 w-7" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-success">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Active · Listening on database
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold">Admissions AI</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Ingests every new lead the moment it lands in the CRM, classifies intent as
                  hot / warm / cold, writes the score back to the lead record, and drafts the
                  advisor&apos;s next action.
                </p>
              </div>
            </div>
            <Button onClick={autoQualify} disabled={running} className="gap-2">
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Qualifying…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Run agent on {Math.min(pending.length, 10)} pending
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total leads handled" value={stats.total} />
          <StatCard label="Last 24 hours" value={stats.last24} />
          <StatCard label="Hot" value={stats.hot} tone="destructive" />
          <StatCard label="Warm" value={stats.warm} tone="warning" />
          <StatCard label="Awaiting qualification" value={stats.unscored} tone="info" />
        </div>

        {/* How it collects */}
        <section className="grid gap-4 lg:grid-cols-3">
          <SourceCard
            icon={Inbox}
            title="Contact form"
            desc="Every submission on /contact writes directly to public.leads (source: website)."
            count={stats.bySource["website"] ?? 0}
          />
          <SourceCard
            icon={MessageSquare}
            title="Stephanie AI chat"
            desc="The public site assistant calls save_lead when a visitor shares name + contact info."
            count={
              (stats.bySource["stephanie"] ?? 0) +
              (stats.bySource["chat"] ?? 0) +
              (stats.bySource["ai_chat"] ?? 0)
            }
          />
          <SourceCard
            icon={FileText}
            title="Manual / other"
            desc="Referrals, phone-ins, and imports that staff enter directly."
            count={
              stats.total -
              ((stats.bySource["website"] ?? 0) +
                (stats.bySource["stephanie"] ?? 0) +
                (stats.bySource["chat"] ?? 0) +
                (stats.bySource["ai_chat"] ?? 0))
            }
          />
        </section>

        {/* Live activity + queue */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-success" />
              <h2 className="font-display text-sm font-bold">Live agent activity</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-success">
                Realtime
              </span>
            </div>
            {log.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Waiting for the next lead intake or qualification run…
              </p>
            ) : (
              <ul className="space-y-2">
                {log.map((row, i) => (
                  <li
                    key={`${row.id}-${i}`}
                    className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/40 p-2.5"
                  >
                    {row.intent ? (
                      <Flame
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          row.intent === "hot"
                            ? "text-destructive"
                            : row.intent === "warm"
                              ? "text-warning"
                              : "text-info"
                        }`}
                      />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground">{row.name}</div>
                      <div className="text-[11px] text-muted-foreground">{row.action}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{relativeTime(row.ts)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-info" />
              <h2 className="font-display text-sm font-bold">Queue · pending qualification</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">
                {pending.length} waiting
              </span>
            </div>
            {pending.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No leads waiting. The agent will pick up the next one automatically.
              </p>
            ) : (
              <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {pending.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-foreground">
                        {l.full_name}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {l.program ?? "Undecided"} · {l.source} · {relativeTime(l.created_at)}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      {l.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="cc-card rounded-2xl p-5">
          <h2 className="mb-3 font-display text-sm font-bold">How this agent works</h2>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">1. Ingest.</span> Subscribes to
              INSERT events on <code className="text-accent">public.leads</code> via Supabase
              Realtime. Every new contact-form or Stephanie-captured lead appears here instantly.
            </li>
            <li>
              <span className="font-semibold text-foreground">2. Qualify.</span> The
              <code className="mx-1 text-accent">analyzeLead</code> server function calls Gemini
              through the Lovable AI Gateway with the lead&apos;s message, program, and source.
            </li>
            <li>
              <span className="font-semibold text-foreground">3. Score.</span> Intent
              (hot/warm/cold) is mapped to a numeric score (90/65/35) and written back to the
              lead row — that same score drives the dashboard funnel and projected income.
            </li>
            <li>
              <span className="font-semibold text-foreground">4. Handoff.</span> Draft reply and
              next action are surfaced on the Leads page for the advisor to send.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "destructive" | "warning" | "info";
}) {
  const toneCls =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : tone === "info"
          ? "text-info"
          : "text-foreground";
  return (
    <div className="cc-card rounded-2xl p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}

function SourceCard({
  icon: Icon,
  title,
  desc,
  count,
}: {
  icon: typeof Inbox;
  title: string;
  desc: string;
  count: number;
}) {
  return (
    <div className="cc-card rounded-2xl p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <div className="font-display text-sm font-bold text-foreground">{title}</div>
          <div className="text-[10px] font-bold uppercase text-success">Connected</div>
        </div>
        <div className="font-display text-xl font-bold text-foreground tabular-nums">{count}</div>
      </div>
      <p className="mt-2.5 text-xs leading-snug text-muted-foreground">{desc}</p>
    </div>
  );
}
