// Client-side simulation data for the AI Lead Generation Agent demo.
// No backend — everything here renders in the browser so the CRM always
// looks like a live AI lead engine working Michigan.

export type DemoLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  program: string;
  message: string;
  status: "new" | "contacted" | "qualified";
  score: number;
  source: string;
  created_at: string;
};

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

// ~12 realistic Michigan CDL leads
export const DEMO_LEADS: DemoLead[] = [
  {
    id: "demo-1",
    full_name: "Darnell Carter",
    email: "darnell.carter@gmail.com",
    phone: "(313) 555-0142",
    city: "Detroit",
    program: "Class A CDL",
    message: "Saw your Google listing — ready to start ASAP, GI Bill eligible.",
    status: "qualified",
    score: 91,
    source: "Google Maps",
    created_at: minutesAgo(6),
  },
  {
    id: "demo-2",
    full_name: "Latasha Brooks",
    email: "latasha.brooks@yahoo.com",
    phone: "(586) 555-0188",
    city: "Sterling Heights",
    program: "Class A CDL",
    message: "Interested in over-the-road. What's the next start date?",
    status: "contacted",
    score: 84,
    source: "Instagram",
    created_at: minutesAgo(14),
  },
  {
    id: "demo-3",
    full_name: "Kevin Osei",
    email: "kevin.osei@outlook.com",
    phone: "(810) 555-0176",
    city: "Flint",
    program: "Class A CDL",
    message: "Veteran — checking GI Bill coverage and home time.",
    status: "qualified",
    score: 90,
    source: "Facebook",
    created_at: minutesAgo(22),
  },
  {
    id: "demo-4",
    full_name: "Andre Williams",
    email: "andre.williams@gmail.com",
    phone: "(586) 555-0119",
    city: "Warren",
    program: "Class B CDL",
    message: "Want a local route, home every night. Booked a campus tour.",
    status: "qualified",
    score: 88,
    source: "Google Maps",
    created_at: minutesAgo(31),
  },
  {
    id: "demo-5",
    full_name: "Maria Gonzalez",
    email: "maria.gonzalez@gmail.com",
    phone: "(616) 555-0153",
    city: "Grand Rapids",
    program: "Class A CDL",
    message: "Comparing schools — asked about financing options.",
    status: "contacted",
    score: 76,
    source: "LinkedIn",
    created_at: minutesAgo(44),
  },
  {
    id: "demo-6",
    full_name: "Tyrone Jackson",
    email: "tyrone.jackson@yahoo.com",
    phone: "(517) 555-0167",
    city: "Lansing",
    program: "Class A CDL",
    message: "Looking to switch careers into trucking this year.",
    status: "new",
    score: 72,
    source: "Instagram",
    created_at: minutesAgo(58),
  },
  {
    id: "demo-7",
    full_name: "Emily Schroeder",
    email: "emily.schroeder@gmail.com",
    phone: "(734) 555-0131",
    city: "Ann Arbor",
    program: "Class B CDL",
    message: "Interested in box-truck / delivery routes.",
    status: "new",
    score: 68,
    source: "Facebook",
    created_at: minutesAgo(73),
  },
  {
    id: "demo-8",
    full_name: "Jamal Robinson",
    email: "jamal.robinson@outlook.com",
    phone: "(269) 555-0124",
    city: "Kalamazoo",
    program: "Class A CDL",
    message: "Found you on Google. Need WIOA grant info.",
    status: "contacted",
    score: 81,
    source: "Google Maps",
    created_at: minutesAgo(96),
  },
  {
    id: "demo-9",
    full_name: "Brittany Nowak",
    email: "brittany.nowak@gmail.com",
    phone: "(248) 555-0190",
    city: "Sterling Heights",
    program: "Class A CDL",
    message: "Asked about weekend / evening schedule options.",
    status: "new",
    score: 65,
    source: "Instagram",
    created_at: minutesAgo(118),
  },
  {
    id: "demo-10",
    full_name: "Marcus Whitfield",
    email: "marcus.whitfield@gmail.com",
    phone: "(313) 555-0108",
    city: "Detroit",
    program: "Class A CDL",
    message: "Hot lead — wants to enroll this week, cash pay.",
    status: "qualified",
    score: 94,
    source: "Google Maps",
    created_at: minutesAgo(140),
  },
  {
    id: "demo-11",
    full_name: "Dwayne Ferguson",
    email: "dwayne.ferguson@yahoo.com",
    phone: "(810) 555-0162",
    city: "Flint",
    program: "Third-Party Skills Exam",
    message: "Already trained — needs the on-site skills test.",
    status: "contacted",
    score: 79,
    source: "LinkedIn",
    created_at: minutesAgo(165),
  },
  {
    id: "demo-12",
    full_name: "Ashley Pham",
    email: "ashley.pham@gmail.com",
    phone: "(734) 555-0147",
    city: "Ann Arbor",
    program: "Class B CDL",
    message: "Researching — asked for a brochure and pricing.",
    status: "new",
    score: 63,
    source: "Facebook",
    created_at: minutesAgo(190),
  },
];

// ---- Live activity feed ----------------------------------------------------

const FIRST_NAMES = [
  "Darnell", "Latasha", "Kevin", "Andre", "Maria", "Tyrone", "Emily", "Jamal",
  "Brittany", "Marcus", "Dwayne", "Ashley", "Terrence", "Shanice", "Devon",
  "Crystal", "Malik", "Tanya", "Rashad", "Keisha",
];
const LAST_INITIALS = ["C", "B", "O", "W", "G", "J", "S", "R", "N", "F", "P", "M", "T", "D", "K"];
const CITIES = [
  "Detroit", "Sterling Heights", "Flint", "Grand Rapids",
  "Lansing", "Warren", "Ann Arbor", "Kalamazoo",
];

export type ActivityKind = "found" | "outreach" | "qualified" | "booked";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  text: string;
  ts: number;
};

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const name = () => `${pick(FIRST_NAMES)} ${pick(LAST_INITIALS)}.`;

export function makeActivity(): ActivityEntry {
  const kind = pick<ActivityKind>(["found", "found", "outreach", "qualified", "booked"]);
  const city = pick(CITIES);
  const who = name();
  let text = "";
  switch (kind) {
    case "found":
      text = `🤖 Lead Agent found a new lead in ${city} — ${who} (score ${randInt(72, 94)})`;
      break;
    case "outreach":
      text = `✉️ Outreach ${pick(["SMS", "email"])} sent to ${who} (${city})`;
      break;
    case "qualified":
      text = `🎯 Lead qualified: ${who} — ${randInt(85, 95)}${pick([", GI Bill eligible", ", WIOA approved", ", ready to enroll"])}`;
      break;
    case "booked":
      text = `📅 Campus tour booked with ${who} (${city})`;
      break;
  }
  return { id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind, text, ts: Date.now() };
}

// Seed a few entries so the feed isn't empty on first paint.
export function seedActivity(count = 4): ActivityEntry[] {
  const out: ActivityEntry[] = [];
  for (let i = 0; i < count; i++) {
    const e = makeActivity();
    e.ts = Date.now() - (i + 1) * randInt(5, 40) * 1000;
    out.push(e);
  }
  return out.sort((a, b) => b.ts - a.ts);
}

export function relTime(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ---- Agent status cards ----------------------------------------------------

export type AgentStat = {
  key: string;
  name: string;
  caption: string;
  status: "Active" | "Standby";
  base: number; // starting counter (0 = no counter shown)
  unit: string;
  tickMax: number; // max increment per tick
};

export const AGENTS: AgentStat[] = [
  { key: "leadgen", name: "Lead-Gen Agent", caption: "Scraping Michigan", status: "Active", base: 142, unit: "leads today", tickMax: 2 },
  { key: "outreach", name: "Outreach Agent", caption: "Sending SMS / email", status: "Active", base: 38, unit: "today", tickMax: 1 },
  { key: "qualifier", name: "Qualifier", caption: "Scoring leads", status: "Active", base: 27, unit: "qualified", tickMax: 1 },
  { key: "booking", name: "Booking Agent", caption: "Standby", status: "Standby", base: 0, unit: "", tickMax: 0 },
];

// Compact pipeline summary embedded into Stephanie's prompt so she can speak
// about the current Michigan leads without a backend call.
export function leadSummaryForPrompt(): string {
  const byStatus = DEMO_LEADS.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});
  const hottest = [...DEMO_LEADS].sort((a, b) => b.score - a.score).slice(0, 3);
  const cities = Array.from(new Set(DEMO_LEADS.map((l) => l.city)));
  return [
    `${DEMO_LEADS.length} active Michigan leads in the pipeline (${byStatus.qualified ?? 0} qualified, ${byStatus.contacted ?? 0} contacted, ${byStatus.new ?? 0} new).`,
    `Cities: ${cities.join(", ")}.`,
    `Hottest leads: ${hottest.map((l) => `${l.full_name} (${l.city}, score ${l.score})`).join("; ")}.`,
  ].join(" ");
}
