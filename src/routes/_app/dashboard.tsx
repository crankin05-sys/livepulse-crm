import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Target,
  Activity,
  Radio,
  UserCheck,
  Wallet,
  CalendarClock,
  Bell,
  Megaphone,
  LineChart,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  leadsQuery,
  studentsQuery,
  vehiclesQuery,
  carriersQuery,
  placementsQuery,
  paymentsQuery,
} from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import { buildMetrics, type Metric, type DashboardMetrics } from "../../lib/dashboard-metrics";
import { AuraExecutive } from "../../components/crm/AuraExecutive";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Executive Control Center | USTDTS CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const leads = useQuery(leadsQuery);
  const students = useQuery(studentsQuery);
  const vehicles = useQuery(vehiclesQuery);
  const carriers = useQuery(carriersQuery);
  const placements = useQuery(placementsQuery);
  const payments = useQuery(paymentsQuery);

  useEffect(() => {
    const channel = supabase
      .channel("dash-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        leads.refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        payments.refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [leads, payments]);

  const metrics = useMemo(
    () =>
      buildMetrics({
        leads: leads.data ?? [],
        students: students.data ?? [],
        payments: payments.data ?? [],
        placements: placements.data ?? [],
        vehicles: vehicles.data ?? [],
        carriers: carriers.data ?? [],
      }),
    [leads.data, students.data, payments.data, placements.data, vehicles.data, carriers.data],
  );

  return (
    <div className="dark cc-shell -m-4 min-h-screen rounded-none p-4 text-foreground lg:-m-8 lg:p-8">
      <div className="space-y-8 pb-10">
      <ControlHeader pct={metrics.revenue.pctToGoal} collected={metrics.revenue.collected} goal={metrics.revenue.goal} />

      <AuraExecutive context={metrics.contextSummary} />

      <Section title="Revenue" icon={Wallet} accent="success">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.revenue.cards.map((m, i) => (
            <BigMetric key={m.label} m={m} highlight={i === 0} />
          ))}
        </div>
      </Section>

      <Section title="Projected Income (Live Pipeline)" icon={TrendingUp} accent="success">
        <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
          Projected income is calculated from real leads currently in the pipeline —
          tuition of ${metrics.pipelineIncome.tuition.toLocaleString()} per student weighted by each
          lead&apos;s close probability (hot 60% · warm 30% · cold 10%).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.pipelineIncome.cards.map((m, i) => (
            <BigMetric key={m.label} m={m} highlight={i === 0} />
          ))}
        </div>
      </Section>

      <Section title="Lead Pipeline" icon={Activity} accent="info">
        <PipelineFunnel funnel={metrics.funnel} />
        <ColorLegend />
      </Section>

      <Section title="Student Pipeline" icon={UserCheck} accent="info">
        <MetricGrid metrics={metrics.pipeline} />
      </Section>

      <Section title="KPI Tracker" icon={LineChart} accent="accent">
        <MetricGrid metrics={metrics.kpi} />
      </Section>

      <Section title="Daily Executive Snapshot" icon={Target} accent="accent">
        <MetricGrid metrics={metrics.executive} />
      </Section>

      <Section title="Lead Qualification Engine" icon={Radio} accent="info">
        <QualificationEngine />
      </Section>

      <Section title="Specialized AI Agents" icon={Megaphone} accent="accent">
        <AgentsGrid metrics={metrics} />
      </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ControlHeader({ pct, collected, goal }: { pct: number; collected: number; goal: number }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hour = now?.getHours() ?? 9;
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-[oklch(0.2_0.05_265)] p-6 text-white shadow-card">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[oklch(0.79_0.16_66)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.66_0.14_152)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[oklch(0.66_0.14_152)]" />
            </span>
            LIVE · EXECUTIVE CONTROL CENTER
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{greeting}, Tyler</h1>
          <p className="mt-1 text-sm text-white/70">
            {now
              ? now.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }) +
                " · " +
                now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
              : "Loading live feed…"}
          </p>
        </div>

        <div className="flex items-center gap-5">
          <GoalRing pct={pct} />
          <div>
            <div className="text-xs uppercase tracking-wide text-white/60">Weekly Goal</div>
            <div className="font-display text-2xl font-bold">
              ${Math.round(collected / 1000)}k
              <span className="text-base font-medium text-white/50"> / ${Math.round(goal / 1000)}k</span>
            </div>
            <div className="text-xs text-white/60">collected this week</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalRing({ pct }: { pct: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="oklch(0.79 0.16 66)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold">
        {pct}%
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: typeof Target;
  accent: "success" | "info" | "accent";
  children: React.ReactNode;
}) {
  const tone =
    accent === "success"
      ? "bg-success/15 text-success"
      : accent === "info"
        ? "bg-info/15 text-info"
        : "bg-accent/15 text-accent-foreground";
  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function BigMetric({ m, highlight }: { m: Metric; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-5 ${highlight ? "cc-card-glow" : "cc-card"}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.label}</div>
      <div className="mt-2 font-display text-2xl font-bold text-foreground">{m.value}</div>
      {m.hint && <div className="mt-1 text-xs font-medium text-success">{m.hint}</div>}
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {metrics.map((m) => (
        <div key={m.label} className="cc-card rounded-xl p-4">
          <div className="font-display text-2xl font-bold text-foreground">{m.value}</div>
          <div className="mt-1 text-xs leading-tight text-muted-foreground">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

function PipelineFunnel({ funnel }: { funnel: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...funnel.map((f) => f.value), 1);
  return (
    <div className="cc-card rounded-2xl p-5">
      <div className="flex flex-col gap-2.5">
        {funnel.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <div className="w-36 shrink-0 text-xs font-medium text-foreground">{f.label}</div>
            <div className="h-7 flex-1 overflow-hidden rounded-lg bg-muted">
              <div
                className="flex h-full items-center justify-end rounded-lg px-2 text-xs font-bold text-white transition-all duration-700"
                style={{
                  width: `${Math.max((f.value / max) * 100, 8)}%`,
                  backgroundColor: f.color,
                }}
              >
                {f.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const LEGEND = [
  { label: "Ready to enroll", color: "var(--color-success)" },
  { label: "Appointment booked", color: "var(--color-info)" },
  { label: "Needs follow-up", color: "var(--color-accent)" },
  { label: "Waiting on financing", color: "var(--color-warning)" },
  { label: "Grant process", color: "oklch(0.55 0.18 300)" },
  { label: "Ineligible", color: "var(--color-destructive)" },
  { label: "Lost lead", color: "oklch(0.6 0 0)" },
];

function ColorLegend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color }} />
          {l.label}
        </span>
      ))}
    </div>
  );
}

const STAGES = [
  { n: 1, title: "Basic Information", items: ["Name", "Phone", "Email", "Zip", "Age", "Start date"] },
  { n: 2, title: "Program Qualification", items: ["MI license", "Age check", "DOT physical", "Drug screen", "DUI / violations", "CDL restrictions"] },
  { n: 3, title: "Intent", items: ["ASAP", "Within 30 days", "Within 90 days", "Researching"] },
  { n: 4, title: "Payment Qualification", items: ["Cash", "Financing", "Employer", "Grant", "Military"] },
  { n: 5, title: "Funding Logic", items: ["Urgent → cash / financing", "Willing to wait → grants", "No upfront promises"] },
  { n: 6, title: "Financing Logic", items: ["Climb Credit", "Liberty", "Submitted / Pending", "Approved / Denied"] },
  { n: 7, title: "Human Handoff", items: ["Identity ✓", "Qualified ✓", "Funding ✓", "Eligible ✓", "Appt requested"] },
];

function QualificationEngine() {
  return (
    <div>
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Every lead is scored and moved through a 7-stage qualification flow before reaching a human.
        AI handles repetitive qualification so admissions only talk to prospects who are ready.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {STAGES.map((s, i) => (
          <div key={s.n} className="cc-card relative rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
                {s.n}
              </span>
              <span className="text-sm font-bold text-foreground">{s.title}</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {s.items.map((it) => (
                <li key={it} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {i < 2 ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
                  ) : (
                    <Circle className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                  )}
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentsGrid({ metrics }: { metrics: DashboardMetrics }) {
  const { temperature, funnel, revenue } = metrics;
  const totalLeads = funnel[0]?.value ?? 0;
  const qualified = funnel[1]?.value ?? 0;
  const enrolled = funnel.find((f) => f.label === "Enrolled")?.value ?? 0;
  const hotWarm = temperature.hot + temperature.warm;

  const agents = [
    {
      name: "Admissions AI",
      role: "Qualifies leads & answers common questions",
      icon: UserCheck,
      count: totalLeads,
      unit: "leads handled",
      live: totalLeads > 0,
      href: "/agents/admissions" as const,
    },
    {
      name: "Funding AI",
      role: "Finds the right payment path — never guarantees grants",
      icon: Wallet,
      count: qualified,
      unit: "financing reviews",
      live: qualified > 0,
      href: "/agents/funding" as const,
    },
    {
      name: "Appointment AI",
      role: "Books real calls & campus tours on the calendar",
      icon: CalendarClock,
      count: hotWarm,
      unit: "prospects to book",
      live: hotWarm > 0,
      href: "/agents/appointment" as const,
    },
    {
      name: "Follow-Up AI",
      role: "Nurtures leads via email & SMS",
      icon: Bell,
      count: temperature.warm + temperature.cold,
      unit: "nurture queue",
      live: temperature.warm + temperature.cold > 0,
    },
    {
      name: "Recruiting AI",
      role: "Finds potential CDL students through outreach",
      icon: Megaphone,
      count: temperature.hot,
      unit: "hot targets",
      live: temperature.hot > 0,
    },
    {
      name: "Executive AI",
      role: "Predictive brief, paperwork triage, campaign ops — voice enabled",
      icon: TrendingUp,
      count: revenue.pctToGoal,
      unit: "% to weekly goal",
      live: true,
      href: "/agents/executive" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((a) => {
        const Icon = a.icon;
        const live = a.live;
        const href = "href" in a ? a.href : undefined;
        const card = (
          <div
            className={`cc-card flex items-start gap-3 rounded-2xl p-5 ${
              href ? "cursor-pointer transition hover:border-accent/50 hover:bg-background/60" : ""
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-foreground">{a.name}</span>
                <span
                  className={`flex items-center gap-1 text-[10px] font-bold uppercase ${live ? "text-success" : "text-muted-foreground"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                  {live ? "Active" : "Idle"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{a.role}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-lg font-bold text-foreground tabular-nums">{a.count}</span>
                <span className="text-[11px] text-muted-foreground">{a.unit}</span>
              </div>
              {href && (
                <div className="mt-2 text-[10px] font-bold uppercase text-accent-foreground/80">
                  Open live view →
                </div>
              )}
            </div>
          </div>
        );
        return href ? (
          <Link key={a.name} to={href}>
            {card}
          </Link>
        ) : (
          <div key={a.name}>{card}</div>
        );
      })}
    </div>
  );
}
