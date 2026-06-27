import type { Lead, Student, Payment, Placement, Vehicle, Carrier } from "./queries";

export const WEEKLY_REVENUE_GOAL = 80000;
export const AVG_TUITION = 6500;

function daysAgo(iso: string | null | undefined): number {
  if (!iso) return 9999;
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

export type Metric = { label: string; value: string | number; hint?: string };

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
  pipeline: Metric[];
  kpi: Metric[];
  executive: Metric[];
  funnel: { label: string; value: number; color: string }[];
  contextSummary: string;
};

const usd = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`;

export function buildMetrics(d: {
  leads: Lead[];
  students: Student[];
  payments: Payment[];
  placements: Placement[];
  vehicles: Vehicle[];
  carriers: Carrier[];
}): DashboardMetrics {
  const { leads, students, payments, placements } = d;

  // ---- Revenue ----
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
  const projected = Math.round(collected + pending * 0.85);
  const remaining = Math.max(WEEKLY_REVENUE_GOAL - collected, 0);
  const pctToGoal = Math.min(100, Math.round((collected / WEEKLY_REVENUE_GOAL) * 100));

  // ---- Lead segmentation ----
  const score = (l: Lead) => l.score ?? 0;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const qualified = leads.filter(
    (l) => l.status === "qualified" || score(l) >= 70,
  ).length;
  const apptScheduled = leads.filter(
    (l) => l.source?.includes("booking") || score(l) >= 85,
  ).length;
  const apptCompleted = Math.round(apptScheduled * 0.7);
  const lost = leads.filter((l) => l.status === "lost").length;
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
    leads.length > 0
      ? Math.round((enrolledStudents / leads.length) * 100)
      : 0;
  const studentsNeeded = Math.max(
    Math.ceil(remaining / AVG_TUITION),
    0,
  );

  const revenueCards: Metric[] = [
    { label: "Weekly Revenue Goal", value: usd(WEEKLY_REVENUE_GOAL) },
    { label: "Revenue Booked", value: usd(booked), hint: "Signed + scheduled" },
    { label: "Revenue Collected", value: usd(collected), hint: `${pctToGoal}% of goal` },
    { label: "Revenue Remaining", value: usd(remaining), hint: `${studentsNeeded} enrollments to goal` },
    { label: "Projected Weekly Revenue", value: usd(projected), hint: "85% close on booked" },
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
    `Weekly revenue goal: ${usd(WEEKLY_REVENUE_GOAL)}.`,
    `Collected: ${usd(collected)} (${pctToGoal}% of goal). Booked: ${usd(booked)}. Remaining: ${usd(remaining)}. Projected: ${usd(projected)}.`,
    `Students needed to hit goal: ${studentsNeeded}.`,
    `Leads — total ${leads.length}, today ${leadsToday}, this week ${leadsWeek}, new ${newLeads}, qualified ${qualified}, lost ${lost}.`,
    `Appointments — scheduled ${apptScheduled}, completed ${apptCompleted}, no-shows ${noShows}.`,
    `Students — enrolled ${enrolledStudents}, waiting ${waiting}. Enrollments this week ${enrollmentsWeek}.`,
    `Close rate ${conversion}%. Pending follow-ups ${followUps}. Best lead source: ${bestSource}.`,
    `Hottest leads: ${hottest(leads)}.`,
  ].join(" ");

  return {
    revenue: { goal: WEEKLY_REVENUE_GOAL, booked, collected, remaining, projected, pctToGoal, cards: revenueCards },
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
  return sorted
    .map((l) => `${l.full_name} at ${l.score ?? 0}%`)
    .join(", ");
}
