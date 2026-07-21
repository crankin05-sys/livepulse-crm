import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Sparkles,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Landmark,
  Banknote,
  CreditCard,
  HelpCircle,
  FileText,
  ExternalLink,
  Radio,
  Receipt,
} from "lucide-react";
import { leadsQuery, paymentsQuery, studentsQuery, type Lead } from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import {
  classifyFunding,
  FUNDING_LABEL,
  type FundingPath,
} from "../../lib/funding-ai.functions";
import { relativeTime, formatCurrency } from "../../lib/format";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/agents/funding")({
  head: () => ({ meta: [{ title: "Funding AI Agent | USTDTS CRM" }] }),
  component: FundingAgentPage,
});

const PATH_ICON: Record<FundingPath, typeof Wallet> = {
  gi_bill: ShieldCheck,
  wioa: Landmark,
  employer: Building2,
  financing: CreditCard,
  cash: Banknote,
  unknown: HelpCircle,
};

const PATH_TONE: Record<FundingPath, string> = {
  gi_bill: "bg-info/15 text-info",
  wioa: "bg-success/15 text-success",
  employer: "bg-accent/15 text-accent-foreground",
  financing: "bg-warning/15 text-warning",
  cash: "bg-primary/15 text-primary",
  unknown: "bg-muted text-muted-foreground",
};

const FORMS = [
  {
    label: "VA Form 22-1990 · GI Bill Application",
    path: "gi_bill" as FundingPath,
    url: "https://www.va.gov/education/how-to-apply/",
  },
  {
    label: "Michigan Works! WIOA Eligibility",
    path: "wioa" as FundingPath,
    url: "https://www.michiganworks.org/",
  },
  {
    label: "Employer Sponsorship Agreement (internal)",
    path: "employer" as FundingPath,
    url: "#",
  },
  {
    label: "Climb Credit financing application",
    path: "financing" as FundingPath,
    url: "https://climbcredit.com/",
  },
  {
    label: "Tuition payment plan (cash / self-pay)",
    path: "cash" as FundingPath,
    url: "#",
  },
];

function FundingAgentPage() {
  const leadsQ = useQuery(leadsQuery);
  const paymentsQ = useQuery(paymentsQuery);
  const studentsQ = useQuery(studentsQuery);
  const qc = useQueryClient();
  const run = useServerFn(classifyFunding);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<
    { id: string; name: string; path?: FundingPath; note: string; ts: string }[]
  >([]);

  useEffect(() => {
    const channel = supabase
      .channel("funding-agent-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          const l = payload.new as Lead;
          const prev = payload.old as Lead;
          if (l.funding_path && l.funding_path !== prev.funding_path) {
            setLog((p) =>
              [
                {
                  id: l.id,
                  name: l.full_name,
                  path: l.funding_path as FundingPath,
                  note: l.funding_notes ?? "Funding path assigned",
                  ts: new Date().toISOString(),
                },
                ...p,
              ].slice(0, 30),
            );
          }
          qc.invalidateQueries({ queryKey: ["leads"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => qc.invalidateQueries({ queryKey: ["payments"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const leads = leadsQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const students = studentsQ.data ?? [];
  const studentName = (id: string) => students.find((s) => s.id === id)?.full_name ?? "Student";

  const distribution = useMemo(() => {
    const counts: Record<FundingPath, number> = {
      gi_bill: 0,
      wioa: 0,
      employer: 0,
      financing: 0,
      cash: 0,
      unknown: 0,
    };
    for (const l of leads) {
      const p = (l.funding_path as FundingPath | null) ?? null;
      if (p && p in counts) counts[p] += 1;
    }
    return counts;
  }, [leads]);

  const unclassified = useMemo(
    () => leads.filter((l) => !l.funding_path).slice(0, 40),
    [leads],
  );

  const paymentTotals = useMemo(() => {
    let collected = 0;
    let pending = 0;
    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      if (p.status === "paid") collected += amt;
      else pending += amt;
    }
    return { collected, pending, count: payments.length };
  }, [payments]);

  async function autoClassify() {
    const targets = unclassified.slice(0, 10);
    if (targets.length === 0) {
      toast.info("Every lead already has a funding path.");
      return;
    }
    setBusy(true);
    toast.info(`Funding AI reviewing ${targets.length} lead${targets.length > 1 ? "s" : ""}…`);
    for (const l of targets) {
      try {
        const res = await run({
          data: {
            id: l.id,
            full_name: l.full_name,
            program: l.program,
            message: l.message,
          },
        });
        setLog((prev) =>
          [
            {
              id: l.id,
              name: l.full_name,
              path: res.path,
              note: res.notes,
              ts: new Date().toISOString(),
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
              note: `Failed: ${e instanceof Error ? e.message : "error"}`,
              ts: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 30),
        );
      }
    }
    await qc.invalidateQueries({ queryKey: ["leads"] });
    setBusy(false);
    toast.success("Funding AI run complete.");
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

        <div className="cc-card-glow rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                <Wallet className="h-7 w-7" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-success">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Active · Routing every lead to a funding path
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold">Funding AI</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Reads each lead&apos;s program and message, then classifies the best-fit funding
                  route — GI Bill, WIOA, employer, private financing, or cash — and writes it
                  back to the lead record. Never guarantees grants.
                </p>
              </div>
            </div>
            <Button onClick={autoClassify} disabled={busy} className="gap-2">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Routing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Route {Math.min(unclassified.length, 10)} unclassified
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Distribution */}
        <section>
          <h2 className="mb-3 font-display text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Funding path distribution · live from leads table
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {(Object.keys(FUNDING_LABEL) as FundingPath[]).map((p) => {
              const Icon = PATH_ICON[p];
              return (
                <div key={p} className="cc-card rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${PATH_TONE[p]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-bold uppercase text-muted-foreground">
                      {FUNDING_LABEL[p]}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold text-foreground tabular-nums">
                    {distribution[p]}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Payments summary */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="cc-card rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-success" />
              <span className="text-[11px] font-bold uppercase text-muted-foreground">
                Collected
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-success">
              {formatCurrency(paymentTotals.collected)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Payments marked paid in the ledger.</p>
          </div>
          <div className="cc-card rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-warning" />
              <span className="text-[11px] font-bold uppercase text-muted-foreground">
                Outstanding
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-warning">
              {formatCurrency(paymentTotals.pending)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pending across {paymentTotals.count} tracked plans.
            </p>
          </div>
          <div className="cc-card rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-info" />
              <span className="text-[11px] font-bold uppercase text-muted-foreground">
                Unclassified queue
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-foreground">
              {unclassified.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Leads waiting for a funding path decision.
            </p>
          </div>
        </section>

        {/* Live activity + queue */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-success" />
              <h2 className="font-display text-sm font-bold">Live routing decisions</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-success">Realtime</span>
            </div>
            {log.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Run the agent, or wait — new funding classifications stream in here.
              </p>
            ) : (
              <ul className="space-y-2">
                {log.map((row, i) => {
                  const Icon = row.path ? PATH_ICON[row.path] : HelpCircle;
                  return (
                    <li
                      key={`${row.id}-${i}`}
                      className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/40 p-2.5"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                          row.path ? PATH_TONE[row.path] : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground">
                          {row.name}
                          {row.path && (
                            <span className="ml-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                              → {FUNDING_LABEL[row.path]}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{row.note}</div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {relativeTime(row.ts)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-info" />
              <h2 className="font-display text-sm font-bold">Payment plans monitored</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">
                {payments.length} records
              </span>
            </div>
            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No payments in the ledger yet.</p>
            ) : (
              <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {payments.slice(0, 20).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-foreground">
                        {studentName(p.student_id)}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {p.description ?? "Tuition payment"} · due {p.due_date ?? "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-sm font-bold text-foreground tabular-nums">
                        {formatCurrency(Number(p.amount) || 0)}
                      </div>
                      <div
                        className={`text-[10px] font-bold uppercase ${
                          p.status === "paid" ? "text-success" : "text-warning"
                        }`}
                      >
                        {p.status}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Connected forms */}
        <div className="cc-card rounded-2xl p-5">
          <h2 className="mb-3 font-display text-sm font-bold">Forms & funding sources connected</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {FORMS.map((f) => {
              const Icon = PATH_ICON[f.path];
              return (
                <li
                  key={f.label}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${PATH_TONE[f.path]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-foreground">{f.label}</div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">
                      {FUNDING_LABEL[f.path]}
                    </div>
                  </div>
                  {f.url !== "#" && (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* How it works */}
        <div className="cc-card rounded-2xl p-5">
          <h2 className="mb-3 font-display text-sm font-bold">How this agent works</h2>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">1. Watch.</span> Subscribes to
              lead inserts/updates and to <code className="text-accent">public.payments</code>{" "}
              via Supabase Realtime.
            </li>
            <li>
              <span className="font-semibold text-foreground">2. Classify.</span> The
              <code className="mx-1 text-accent">classifyFunding</code> server function calls
              Gemini through the Lovable AI Gateway and picks one of six funding paths.
            </li>
            <li>
              <span className="font-semibold text-foreground">3. Persist.</span> Path + a short
              note are written back to <code className="text-accent">leads.funding_path</code> and
              <code className="mx-1 text-accent">leads.funding_notes</code>.
            </li>
            <li>
              <span className="font-semibold text-foreground">4. Route.</span> The advisor sees
              which form to send next (VA GI Bill, Michigan WIOA, employer sponsorship, Climb
              Credit, or a cash plan) and monitors real payment records for enrolled students.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
