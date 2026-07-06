import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Search, Sparkle, Loader2, Copy, Check, Flame } from "lucide-react";
import { leadsQuery } from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import { analyzeLead } from "../../lib/crm-ai.functions";
import { leadTemperature, type Temperature } from "../../lib/dashboard-metrics";
import { AgentStatusCards } from "../../components/crm/AgentStatusCards";
import { LeadActivityFeed } from "../../components/crm/LeadActivityFeed";
import { PageHeader } from "../../components/crm/Primitives";
import { relativeTime } from "../../lib/format";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "Leads | USTDTS CRM" }] }),
  component: Leads,
});

const statuses = ["new", "contacted", "qualified", "application_started", "enrolled", "rejected"];

const tempStyles: Record<Temperature, string> = {
  hot: "bg-destructive/15 text-destructive",
  warm: "bg-warning/20 text-warning-foreground",
  cold: "bg-info/15 text-info-foreground",
};

type LeadRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  program: string | null;
  message: string | null;
  status: string;
  score: number;
  source: string;
  created_at: string;
};

type Analysis = {
  summary: string;
  intent: "hot" | "warm" | "cold";
  next_action: string;
  draft_reply: string;
};

const intentStyles: Record<string, string> = {
  hot: "bg-destructive/15 text-destructive",
  warm: "bg-warning/20 text-warning-foreground",
  cold: "bg-info/15 text-info-foreground",
};

function CoPilotDialog({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  const run = useServerFn(analyzeLead);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Analysis | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErr(null);
    run({
      data: {
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        program: lead.program,
        message: lead.message,
        status: lead.status,
        score: lead.score,
        source: lead.source,
      },
    })
      .then((res) => {
        if (active) setData(res as Analysis);
      })
      .catch((e) => {
        if (active) setErr(e instanceof Error ? e.message : "Something went wrong");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [lead, run]);

  function copyReply() {
    if (!data) return;
    navigator.clipboard.writeText(data.draft_reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Sparkle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">AI Co-pilot</h3>
            <p className="text-xs text-muted-foreground">{lead.full_name} · {lead.email}</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing lead…
          </div>
        )}

        {err && <p className="mt-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

        {data && (
          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intent</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${intentStyles[data.intent]}`}>
                  <Flame className="h-3 w-3" /> {data.intent}
                </span>
              </div>
              <p className="text-sm text-foreground">{data.summary}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended next step</span>
              <p className="mt-1 text-sm text-foreground">{data.next_action}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Draft follow-up</span>
                <button onClick={copyReply} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>
              <div className="whitespace-pre-wrap rounded-lg border border-border bg-secondary/50 p-3 text-sm text-foreground">
                {data.draft_reply}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function Leads() {
  const leads = useQuery(leadsQuery);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<LeadRow | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("leads-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        qc.invalidateQueries({ queryKey: ["leads"] });
        toast.info("Leads updated");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["leads"] });
  }

  const merged = [...(DEMO_LEADS as unknown as LeadRow[]), ...((leads.data ?? []) as LeadRow[])];
  const rows = merged.filter((l) => {
    const matchesQ = `${l.full_name} ${l.email} ${l.program ?? ""}`.toLowerCase().includes(q.toLowerCase());
    const matchesF = filter === "all" || l.status === filter;
    return matchesQ && matchesF;
  });

  return (
    <div>
      <PageHeader title="Leads" subtitle="Inbound applications from the website & AI assistant, updated in real time." />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_minmax(320px,420px)]">
        <div className="space-y-4">
          <AgentStatusCards />
        </div>
        <LeadActivityFeed />
      </div>


      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads…"
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none">
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Program</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Co-pilot</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{l.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{l.email}</div>
                    {l.phone && <div className="text-xs">{l.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.program ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-foreground">{l.score}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{relativeTime(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={l.status}
                      onChange={(e) => setStatus(l.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs capitalize outline-none"
                    >
                      {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="accent" size="sm" className="gap-1.5" onClick={() => setActive(l)}>
                      <Sparkle className="h-3.5 w-3.5" /> Analyze
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No leads match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {active && <CoPilotDialog lead={active} onClose={() => setActive(null)} />}
    </div>
  );
}
