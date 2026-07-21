import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Megaphone, Sparkles, Loader2, Radio, ArrowLeft, ArrowLeftRight, Briefcase, ArrowLeft as _l, CheckCircle2, Building2 } from "lucide-react";
import { studentsQuery, carriersQuery, placementsQuery, type Student } from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import { matchGraduate } from "../../lib/recruiting-ai.functions";
import { relativeTime } from "../../lib/format";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/agents/recruiting")({
  head: () => ({ meta: [{ title: "Recruiting AI Agent | USTDTS CRM" }] }),
  component: RecruitingAgentPage,
});

type LogRow = { id: string; student: string; carrier: string; salary: number; ts: string };

function isReady(s: Student): boolean {
  return (s.progress_pct ?? 0) >= 60 && !["placed", "dropped"].includes(s.status);
}

function RecruitingAgentPage() {
  const studentsQ = useQuery(studentsQuery);
  const carriersQ = useQuery(carriersQuery);
  const placementsQ = useQuery(placementsQuery);
  const qc = useQueryClient();
  const run = useServerFn(matchGraduate);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogRow[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("recruiting-agent-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "placements" }, () => {
        qc.invalidateQueries({ queryKey: ["placements"] });
        qc.invalidateQueries({ queryKey: ["carriers"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const students = studentsQ.data ?? [];
  const carriers = carriersQ.data ?? [];
  const placements = placementsQ.data ?? [];

  const ready = useMemo(() => students.filter(isReady), [students]);
  const hiring = useMemo(() => carriers.filter((c) => c.hiring && c.openings > 0), [carriers]);
  const openSeats = hiring.reduce((s, c) => s + (c.openings ?? 0), 0);
  const placedTotal = placements.length;
  const avgSalary =
    placements.length > 0
      ? Math.round(placements.reduce((s, p) => s + Number(p.salary ?? 0), 0) / placements.length)
      : 0;

  async function runMatch() {
    const targets = ready.slice(0, 6);
    if (targets.length === 0) return toast.info("No students ready to place.");
    if (hiring.length === 0) return toast.error("No hiring carriers with open seats.");
    setRunning(true);
    toast.info(`Recruiting AI matching ${targets.length}…`);
    for (const s of targets) {
      try {
        const res = await run({ data: { studentId: s.id } });
        setLog((prev) =>
          [
            { id: s.id, student: res.studentName, carrier: res.carrierName, salary: res.salary, ts: new Date().toISOString() },
            ...prev,
          ].slice(0, 30),
        );
      } catch (e) {
        toast.error(`${s.full_name}: ${e instanceof Error ? e.message : "error"}`);
      }
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["placements"] }),
      qc.invalidateQueries({ queryKey: ["carriers"] }),
    ]);
    setRunning(false);
    toast.success("Recruiting AI run complete.");
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
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-info/15 text-info">
                <Megaphone className="h-7 w-7" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-success">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Active · Matching graduates to carriers
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold">Recruiting AI</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Pairs students at 60%+ progress with the highest-paying hiring carrier that has open seats,
                  creates a real placement record, and decrements the carrier&apos;s open seats so the pipeline stays live.
                </p>
              </div>
            </div>
            <Button onClick={runMatch} disabled={running || ready.length === 0 || hiring.length === 0} className="gap-2">
              {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Matching…</> : <><Sparkles className="h-4 w-4" /> Match {Math.min(ready.length, 6)} graduates</>}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Students ready" value={ready.length} tone="info" />
          <Stat label="Carrier open seats" value={openSeats} />
          <Stat label="Placements booked" value={placedTotal} tone="success" />
          <Stat label="Avg placement salary" value={avgSalary ? `$${avgSalary.toLocaleString()}` : "—"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-success" />
              <h2 className="font-display text-sm font-bold">Live matches</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-success">Realtime</span>
            </div>
            {log.length === 0 ? (
              <p className="text-xs text-muted-foreground">Run the agent to start matching graduates to carriers.</p>
            ) : (
              <ul className="space-y-2">
                {log.map((row, i) => (
                  <li key={`${row.id}-${i}`} className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/40 p-2.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground">{row.student}</div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ArrowLeftRight className="h-3 w-3" /> {row.carrier}
                        {row.salary > 0 && <span className="ml-auto font-semibold text-success">${row.salary.toLocaleString()}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{relativeTime(row.ts)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-info" />
              <h2 className="font-display text-sm font-bold">Ready-to-place queue</h2>
              <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">{ready.length} students</span>
            </div>
            {ready.length === 0 ? (
              <p className="text-xs text-muted-foreground">No students at 60%+ progress right now.</p>
            ) : (
              <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {ready.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-foreground">{s.full_name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{s.program} · {s.progress_pct}% complete · {s.status}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-info">Ready</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="cc-card rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-warning" />
            <h2 className="font-display text-sm font-bold">Hiring carriers · live seats</h2>
          </div>
          {hiring.length === 0 ? (
            <p className="text-xs text-muted-foreground">No carriers with open seats. Recruiting AI is holding.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {hiring.map((c) => (
                <div key={c.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-foreground">{c.name}</div>
                    <div className="text-[10px] font-bold uppercase text-success">{c.openings} open</div>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{c.locations ?? "—"}</div>
                  {c.avg_salary && <div className="mt-1 text-[11px] font-semibold text-accent">${Number(c.avg_salary).toLocaleString()}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cc-card rounded-2xl p-5">
          <h2 className="mb-3 font-display text-sm font-bold">How this agent works</h2>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li><span className="font-semibold text-foreground">1. Scan.</span> Queries <code className="text-accent">public.students</code> for anyone at 60%+ progress not already placed.</li>
            <li><span className="font-semibold text-foreground">2. Rank.</span> Reads <code className="text-accent">public.carriers</code> where <code className="text-accent">hiring=true</code> and <code className="text-accent">openings&gt;0</code>, sorted by average salary.</li>
            <li><span className="font-semibold text-foreground">3. Match.</span> Inserts a real row in <code className="text-accent">public.placements</code> with status <code className="text-accent">interviewing</code>, and decrements the carrier&apos;s open seats.</li>
            <li><span className="font-semibold text-foreground">4. Compound.</span> Every match feeds the dashboard&apos;s Job Placement funnel and average placement salary in real time.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "info" | "success" }) {
  const cls = tone === "info" ? "text-info" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="cc-card rounded-2xl p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
