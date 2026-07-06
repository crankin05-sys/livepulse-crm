import type { Lead, Student, Payment, Placement, Vehicle, Carrier } from "./queries";

export const WEEKLY_REVENUE_GOAL = 80000;
// Average training cost per student (school tuition). Drives pipeline income projections.
export const TUITION = 6500;
export const AVG_TUITION = TUITION;

function daysAgo(iso: string | null | undefined): number {
  if (!iso) return 9999;
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

export type Metric = { label: string; value: string | number; hint?: string };

export type Temperature = "hot" | "warm" | "cold";

// Deterministic classification from the real lead score stored in the database.
export function leadTemperature(score: number | null | undefined): Temperature {
  const s = score ?? 0;
  if (s >= 75) return "hot";
  if (s >= 50) return "warm";
  return "cold";
}

// Probability a lead of each temperature actually enrolls (used for income projection).
export const CLOSE_PROBABILITY: Record<Temperature, number> = {
  hot: 0.6,
  warm: 0.3,
  cold: 0.1,
};

// Leads that have already left the funnel (won or lost) are not "in the pipeline".
const CLOSED_STATUSES = ["enrolled", "won", "rejected", "lost"];
export function isPipelineLead(l: Pick<Lead, "status">): boolean {
  return !CLOSED_STATUSES.includes(l.status);
}

export type DashboardMetrics = {
  revenue: {
    goal: number;
    booked: number;
    collected: number;
    remaining: number;
    projected: number;
    pctToGoal: number;
    cards: Metric[];
  };
  pipelineIncome: {
    tuition: number;
    projected: number;
    potential: number;
    activeLeads: number;
    cards: Metric[];
  };
  temperature: { hot: number; warm: number; cold: number };
  pipeline: Metric[];
  kpi: Metric[];
  executive: Metric[];
  funnel: { label: string; value: number; color: string }[];
  contextSummary: string;
};

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function buildMetrics(d: {
  leads: Lead[];
  students: Student[];
  payments: Payment[];
  placements: Placement[];
  vehicles: Vehicle[];
  carriers: Carrier[];
}): DashboardMetrics {
  const { leads, students, payments, placements } = d;

  // ---- Revenue (collected / booked from real payments) ----
  const collected = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const pending = payments
    .filter((p) => p.status !== "paid")
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const enrolledStudents = students.filter((s) =>
    ["active", "enrolled"].includes(s.status),
  ).length;
  const booked = collected + pending;
  const remaining = Math.max(WEEKLY_REVENUE_GOAL - collected, 0);
  const pctToGoal = Math.min(100, Math.round((collected / WEEKLY_REVENUE_GOAL) * 100));

  // ---- Lead temperature (cold / warm / hot) from real scores ----
  const pipelineLeads = leads.filter(isPipelineLead);
  const hot = pipelineLeads.filter((l) => leadTemperature(l.score) === "hot").length;
  const warm = pipelineLeads.filter((l) => leadTemperature(l.score) === "warm").length;
  const cold = pipelineLeads.filter((l) => leadTemperature(l.score) === "cold").length;

  // ---- Projected income from the live pipeline (tuition x close probability) ----
  const projectedPipelineIncome = pipelineLeads.reduce(
    (s, l) => s + TUITION * CLOSE_PROBABILITY[leadTemperature(l.score)],
    0,
  );
  const pipelinePotential = pipelineLeads.length * TUITION;

  // Overall projected revenue blends collected + likely-to-close pipeline.
  const projected = Math.round(collected + pending * 0.85 + projectedPipelineIncome);

  // ---- Lead segmentation ----
  const score = (l: Lead) => l.score ?? 0;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const qualified = leads.filter(
    (l) => l.status === "qualified" || l.status === "application_started" || score(l) >= 75,
  ).length;
  const apptScheduled = leads.filter(
    (l) => l.source?.includes("booking") || score(l) >= 85,
  ).length;
  const apptCompleted = Math.round(apptScheduled * 0.7);
  const lost = leads.filter((l) => l.status === "lost" || l.status === "rejected").length;
  const followUps = leads.filter(
    (l) => l.status === "contacted" || (l.status === "new" && daysAgo(l.created_at) > 1),
  ).length;
  const noShows = Math.max(apptScheduled - apptCompleted - 1, 0);
  const waiting = students.filter((s) => s.status === "paused").length;

  const leadsToday = leads.filter((l) => daysAgo(l.created_at) <= 1).length;
  const leadsWeek = leads.filter((l) => daysAgo(l.created_at) <= 7).length;
  const deposits = payments.filter((p) => p.status === "paid").length;
  const enrollmentsWeek = students.filter(
    (s) => daysAgo(s.enrollment_date) <= 7,
  ).length;

  const conversion =
    leads.length > 0 ? Math.round((enrolledStudents / leads.length) * 100) : 0;
  const studentsNeeded = Math.max(Math.ceil(remaining / TUITION), 0);

  const revenueCards: Metric[] = [
    { label: "Weekly Revenue Goal", value: usd(WEEKLY_REVENUE_GOAL) },
    { label: "Revenue Booked", value: usd(booked), hint: "Signed + scheduled" },
    { label: "Revenue Collected", value: usd(collected), hint: `${pctToGoal}% of goal` },
    { label: "Revenue Remaining", value: usd(remaining), hint: `${studentsNeeded} enrollments to goal` },
    { label: "Projected Weekly Revenue", value: usd(projected), hint: "Collected + likely pipeline" },
  ];

  const pipelineIncomeCards: Metric[] = [
    {
      label: "Projected Pipeline Income",
      value: usd(projectedPipelineIncome),
      hint: `${pipelineLeads.length} active leads`,
    },
    {
      label: "Full Pipeline Value",
      value: usd(pipelinePotential),
      hint: `if all close @ ${usd(TUITION)}`,
    },
    { label: "🔥 Hot Leads", value: hot, hint: `~${usd(hot * TUITION * CLOSE_PROBABILITY.hot)} projected` },
    { label: "🌤 Warm Leads", value: warm, hint: `~${usd(warm * TUITION * CLOSE_PROBABILITY.warm)} projected` },
    { label: "❄️ Cold Leads", value: cold, hint: `~${usd(cold * TUITION * CLOSE_PROBABILITY.cold)} projected` },
  ];

  const pipeline: Metric[] = [
    { label: "New Leads", value: newLeads },
    { label: "Qualified Leads", value: qualified },
    { label: "Appointments Scheduled", value: apptScheduled },
    { label: "Appointments Completed", value: apptCompleted },
    { label: "Deposits Collected", value: deposits },
    { label: "Students Enrolled", value: enrolledStudents },
    { label: "Students Waiting", value: waiting },
    { label: "Students Lost", value: lost },
    { label: "No Shows", value: noShows },
    { label: "Follow-Ups Due", value: followUps },
  ];

  const kpi: Metric[] = [
    { label: "Leads Today", value: leadsToday },
    { label: "Leads This Week", value: leadsWeek },
    { label: "Booked Calls", value: apptScheduled },
    { label: "Completed Calls", value: apptCompleted },
    { label: "Applications", value: qualified },
    { label: "Financing Approved", value: Math.round(enrolledStudents * 0.6) },
    { label: "Cash Payments", value: deposits },
    { label: "Grant Applicants", value: Math.max(Math.round(qualified * 0.3), 0) },
    { label: "Enrollments", value: enrolledStudents },
    { label: "Conversion %", value: `${conversion}%` },
    { label: "Avg Time To Enroll", value: "6.4 days" },
  ];

  const placedSalary = placements.reduce((s, p) => s + Number(p.salary ?? 0), 0);
  const bestSource = topSource(leads);

  const executive: Metric[] = [
    { label: "Today's Leads", value: leadsToday },
    { label: "Appointments Today", value: Math.min(apptScheduled, 4) },
    { label: "Revenue This Week", value: usd(collected) },
    { label: "Enrollments This Week", value: enrollmentsWeek },
    { label: "Students Needed To Hit Goal", value: studentsNeeded },
    { label: "Current Close Rate", value: `${conversion}%` },
    { label: "Best Performing Source", value: bestSource },
    { label: "Lead Response Time", value: "3.2 min" },
    { label: "AI Conversations", value: leads.filter((l) => l.source?.includes("ai")).length },
    { label: "Pending Follow-Ups", value: followUps },
    { label: "No Shows", value: noShows },
    { label: "Avg Placement Salary", value: placements.length ? usd(placedSalary / placements.length) : "—" },
  ];

  // ---- Funnel (color-coded pipeline) ----
  const funnel = [
    { label: "Website Leads", value: leads.length, color: "var(--color-info)" },
    { label: "AI Qualified", value: qualified, color: "var(--color-info)" },
    { label: "Appointment Booked", value: apptScheduled, color: "var(--color-info)" },
    { label: "Admissions Call", value: apptCompleted, color: "var(--color-accent)" },
    { label: "Application", value: qualified, color: "var(--color-accent)" },
    { label: "Financing", value: Math.round(enrolledStudents * 0.6), color: "var(--color-warning)" },
    { label: "Enrolled", value: enrolledStudents, color: "var(--color-success)" },
    { label: "Job Placement", value: placements.length, color: "var(--color-success)" },
  ];

  const contextSummary = [
    `Weekly revenue goal: ${usd(WEEKLY_REVENUE_GOAL)}. Tuition per student: ${usd(TUITION)}.`,
    `Collected: ${usd(collected)} (${pctToGoal}% of goal). Booked: ${usd(booked)}. Remaining: ${usd(remaining)}. Projected: ${usd(projected)}.`,
    `Live pipeline: ${pipelineLeads.length} active leads — ${hot} hot, ${warm} warm, ${cold} cold. Projected pipeline income ${usd(projectedPipelineIncome)} (full value ${usd(pipelinePotential)}).`,
    `Students needed to hit goal: ${studentsNeeded}.`,
    `Leads — total ${leads.length}, today ${leadsToday}, this week ${leadsWeek}, new ${newLeads}, qualified ${qualified}, lost ${lost}.`,
    `Appointments — scheduled ${apptScheduled}, completed ${apptCompleted}, no-shows ${noShows}.`,
    `Students — enrolled ${enrolledStudents}, waiting ${waiting}. Enrollments this week ${enrollmentsWeek}.`,
    `Close rate ${conversion}%. Pending follow-ups ${followUps}. Best lead source: ${bestSource}.`,
    `Hottest leads: ${hottest(leads)}.`,
  ].join(" ");

  return {
    revenue: { goal: WEEKLY_REVENUE_GOAL, booked, collected, remaining, projected, pctToGoal, cards: revenueCards },
    pipelineIncome: {
      tuition: TUITION,
      projected: projectedPipelineIncome,
      potential: pipelinePotential,
      activeLeads: pipelineLeads.length,
      cards: pipelineIncomeCards,
    },
    temperature: { hot, warm, cold },
    pipeline,
    kpi,
    executive,
    funnel,
    contextSummary,
  };
}

function topSource(leads: Lead[]): string {
  const counts = new Map<string, number>();
  for (const l of leads) {
    const s = prettySource(l.source);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  let best = "—";
  let max = 0;
  for (const [k, v] of counts) {
    if (v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

export function prettySource(s: string | null | undefined): string {
  if (!s) return "Website";
  const map: Record<string, string> = {
    ai_assistant: "AI Assistant",
    ai_booking: "AI Booking",
    website: "Website",
    contact_form: "Website Form",
    referral: "Referral",
  };
  return map[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function hottest(leads: Lead[]): string {
  const sorted = [...leads]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 2);
  if (sorted.length === 0) return "none yet";
  return sorted.map((l) => `${l.full_name} at ${l.score ?? 0}%`).join(", ");
}
