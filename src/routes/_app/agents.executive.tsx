import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  ArrowLeft,
  Radio,
  Sparkles,
  AlertTriangle,
  Megaphone,
  Target,
  FileWarning,
  Flame,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import {
  leadsQuery,
  studentsQuery,
  paymentsQuery,
  documentsQuery,
  type Lead,
} from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import {
  buildMetrics,
  leadTemperature,
  WEEKLY_REVENUE_GOAL,
  TUITION,
} from "../../lib/dashboard-metrics";
import { AuraExecutive } from "../../components/crm/AuraExecutive";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  audience_size: number;
  budget: number;
  spend: number;
  leads_generated: number;
  notes: string | null;
  created_at: string;
};

const REQUIRED_DOCS = [
  { key: "cdl_permit", label: "CDL Permit" },
  { key: "medical_card", label: "DOT Medical Card" },
  { key: "drivers_license", label: "Driver's License" },
  { key: "ssn_card", label: "SSN Card" },
  { key: "enrollment_agreement", label: "Enrollment Agreement" },
];

export const Route = createFileRoute("/_app/agents/executive")({
  head: () => ({ meta: [{ title: "Executive AI · Aura | USTDTS CRM" }] }),
  component: ExecutiveAgentPage,
});

function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Campaign[];
    },
  });
}

function ExecutiveAgentPage() {
  const leadsQ = useQuery(leadsQuery);
  const studentsQ = useQuery(studentsQuery);
  const paymentsQ = useQuery(paymentsQuery);
  const docsQ = useQuery(documentsQuery);
  const campaignsQ = useCampaigns();
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel("aura-executive-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, () =>
        qc.invalidateQueries({ queryKey: ["campaigns"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () =>
        qc.invalidateQueries({ queryKey: ["leads"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const leads = leadsQ.data ?? [];
  const students = studentsQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const documents = docsQ.data ?? [];
  const campaigns = campaignsQ.data ?? [];

  const metrics = useMemo(
    () =>
      buildMetrics({
        leads,
        students,
        payments,
        placements: [],
        vehicles: [],
        carriers: [],
      }),
    [leads, students, payments],
  );

  // Missing paperwork per active student
  const missing = useMemo(() => {
    const active = students.filter((s) => ["active", "enrolled"].includes(s.status));
    return active
      .map((st) => {
        const have = new Set(
          documents
            .filter(
              (d) =>
                d.student_id === st.id &&
                ["received", "approved", "complete"].includes(d.status),
            )
            .map((d) => d.doc_type),
        );
        const gaps = REQUIRED_DOCS.filter((d) => !have.has(d.key));
        return { student: st, gaps };
      })
      .filter((r) => r.gaps.length > 0)
      .sort((a, b) => b.gaps.length - a.gaps.length);
  }, [students, documents]);

  const totalMissing = missing.reduce((n, r) => n + r.gaps.length, 0);

  const hottest = useMemo(
    () =>
      [...leads]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 5),
    [leads],
  );

  const collected = metrics.revenue.collected;
  const remaining = metrics.revenue.remaining;
  const studentsNeeded = Math.ceil(remaining / TUITION);

  // Priority action queue derived from live data
  const priorities = useMemo(() => {
    const list: { icon: typeof Flame; text: string; tone: string }[] = [];
    if (hottest[0] && (hottest[0].score ?? 0) >= 75) {
      list.push({
        icon: Flame,
        text: `Call ${hottest[0].full_name} — hottest lead at ${hottest[0].score}%${hottest[0].phone ? ` (${hottest[0].phone})` : ""}.`,
        tone: "destructive",
      });
    }
    if (totalMissing > 0) {
      list.push({
        icon: FileWarning,
        text: `Chase ${totalMissing} missing document${totalMissing > 1 ? "s" : ""} across ${missing.length} student${missing.length > 1 ? "s" : ""} to clear enrollment.`,
        tone: "warning",
      });
    }
    if (studentsNeeded > 0) {
      list.push({
        icon: Target,
        text: `Close ${studentsNeeded} more enrollment${studentsNeeded > 1 ? "s" : ""} this week to hit the $${WEEKLY_REVENUE_GOAL.toLocaleString()} goal.`,
        tone: "info",
      });
    }
    const pausedCount = campaigns.filter((c) => c.status === "paused").length;
    if (pausedCount > 0) {
      list.push({
        icon: Megaphone,
        text: `${pausedCount} campaign${pausedCount > 1 ? "s are" : " is"} paused — reactivate or archive to keep lead volume up.`,
        tone: "info",
      });
    }
    if (list.length === 0) {
      list.push({
        icon: Sparkles,
        text: "Everything looks green. Ask Aura for growth levers to widen the lead."
      , tone: "success" });
    }
    return list;
  }, [hottest, totalMissing, missing.length, studentsNeeded, campaigns]);

  async function toggleCampaign(c: Campaign) {
    const next = c.status === "active" ? "paused" : "active";
    const { error } = await supabase.from("campaigns").update({ status: next }).eq("id", c.id);
    if (error) toast.error(error.message);
    else toast.success(`${c.name} is now ${next}.`);
    qc.invalidateQueries({ queryKey: ["campaigns"] });
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
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <TrendingUp className="h-7 w-7" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-success">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Active · Predictive analysis, paperwork triage, campaign ops
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold">Executive AI · Aura</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Your voice-enabled Chief of Staff. Reads live database state every question,
                  tells you the single move that matters most, flags missing paperwork, and
                  launches or pauses campaigns on command.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live executive stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Revenue vs Goal"
            value={`${metrics.revenue.pctToGoal}%`}
            hint={`$${collected.toLocaleString()} / $${WEEKLY_REVENUE_GOAL.toLocaleString()}`}
          />
          <Stat
            label="Students to Goal"
            value={studentsNeeded}
            hint="Enrollments needed"
            tone="warning"
          />
          <Stat
            label="Missing Paperwork"
            value={totalMissing}
            hint={`${missing.length} student${missing.length === 1 ? "" : "s"} affected`}
            tone={totalMissing > 0 ? "destructive" : "success"}
          />
          <Stat
            label="Active Campaigns"
            value={campaigns.filter((c) => c.status === "active").length}
            hint={`$${campaigns.reduce((n, c) => n + Number(c.spend ?? 0), 0).toLocaleString()} spent`}
          />
        </div>

        {/* Aura chat panel + Priority queue */}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <AuraExecutive context={metrics.contextSummary} />
          </div>

          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="font-display text-sm font-bold">Priority actions right now</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">
                Live
              </span>
            </div>
            <ol className="space-y-2">
              {priorities.map((p, i) => {
                const Icon = p.icon;
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/40 p-3"
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        p.tone === "destructive"
                          ? "text-destructive"
                          : p.tone === "warning"
                            ? "text-warning"
                            : p.tone === "success"
                              ? "text-success"
                              : "text-info"
                      }`}
                    />
                    <span className="text-xs leading-snug text-foreground">{p.text}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Missing paperwork + Campaigns */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-warning" />
              <h2 className="font-display text-sm font-bold">Paperwork Aura is watching</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">
                {missing.length} student{missing.length === 1 ? "" : "s"}
              </span>
            </div>
            {missing.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                All active students are fully documented. Aura will alert you the moment a doc
                goes missing.
              </p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {missing.slice(0, 12).map((r) => (
                  <li
                    key={r.student.id}
                    className="rounded-lg border border-border/50 bg-background/40 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {r.student.full_name}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-destructive">
                        {r.gaps.length} missing
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.gaps.map((g) => (
                        <span
                          key={g.key}
                          className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning"
                        >
                          {g.label}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-info" />
              <h2 className="font-display text-sm font-bold">Active campaigns Aura runs</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">
                {campaigns.length} total
              </span>
            </div>
            {campaignsQ.isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading campaigns…
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No campaigns yet. Ask Aura to launch one — e.g. "Launch a $500 Facebook
                campaign for Metro Detroit CDL leads."
              </p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {campaigns.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-border/50 bg-background/40 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-foreground">
                          {c.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {c.channel} · ${Number(c.spend).toLocaleString()} spent · {c.leads_generated} leads
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            c.status === "active" ? "text-success" : "text-muted-foreground"
                          }`}
                        >
                          {c.status}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-[11px]"
                          onClick={() => toggleCampaign(c)}
                        >
                          {c.status === "active" ? (
                            <>
                              <Pause className="h-3 w-3" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" /> Resume
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Hot leads Aura recommends calling */}
        <div className="cc-card rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <Radio className="h-4 w-4 text-destructive" />
            <h2 className="font-display text-sm font-bold">Who Aura says to call first</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {hottest.map((l: Lead) => (
              <div
                key={l.id}
                className="rounded-lg border border-border/50 bg-background/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {l.full_name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      leadTemperature(l.score) === "hot"
                        ? "bg-destructive/15 text-destructive"
                        : leadTemperature(l.score) === "warm"
                          ? "bg-warning/15 text-warning"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {l.score ?? 0}%
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {l.phone ?? "no phone"} · {l.program ?? "undecided"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "destructive" | "warning" | "success";
}) {
  const toneCls =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : tone === "success"
          ? "text-success"
          : "text-foreground";
  return (
    <div className="cc-card rounded-2xl p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${toneCls}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
