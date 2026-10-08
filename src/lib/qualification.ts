// Shared (client-safe) qualification rules for the Qualifying AI agent.
export const TUITION = 6500;

export type QualAnswers = {
  age: number;
  michigan_resident: boolean;
  valid_license: boolean;
  license_years: number;
  dui_last_2y: boolean; // OWI/DUI or suspension in last 2 years
  can_pass_dot: boolean; // DOT physical + drug test
  english_ok: boolean; // FMCSA English proficiency
  funding: "gi_bill" | "wioa" | "employer" | "financing" | "cash" | "unsure";
  monthly_budget: number; // $ per month they can pay
  savings: number; // $ available today
  start_timeline: "now" | "30d" | "90d" | "later";
  schedule_ok: boolean; // can attend 4-7 weeks full-time
  motivation: "career" | "money" | "exploring";
};

export const QUESTIONS: { key: keyof QualAnswers; q: string; why: string }[] = [
  { key: "age", q: "How old are you?", why: "21+ for interstate Class A. 18–20 = Michigan intrastate only." },
  { key: "michigan_resident", q: "Do you live in Michigan?", why: "School only serves Michigan residents." },
  { key: "valid_license", q: "Do you have a valid, non-suspended driver's license?", why: "Required to get a CDL permit." },
  { key: "license_years", q: "How many years have you been driving?", why: "Many carriers want 1+ year of driving history." },
  { key: "dui_last_2y", q: "Any OWI/DUI or suspension in the last 2 years?", why: "Carriers won't hire; usually a hard stop." },
  { key: "can_pass_dot", q: "Can you pass a DOT physical and drug test?", why: "Federal requirement — no exceptions." },
  { key: "english_ok", q: "Can you read and speak English comfortably?", why: "FMCSA English proficiency rule." },
  { key: "funding", q: "How do you plan to pay the $6,500 tuition?", why: "Determines affordability path." },
  { key: "monthly_budget", q: "What could you comfortably pay per month?", why: "Payment plans need ~$300+/mo." },
  { key: "savings", q: "How much do you have available today for a down payment?", why: "Down payment reserves the seat." },
  { key: "start_timeline", q: "When do you want to start?", why: "Sooner = higher intent." },
  { key: "schedule_ok", q: "Can you commit to 4–7 weeks of training?", why: "Must complete range + road hours." },
  { key: "motivation", q: "Why do you want to drive trucks?", why: "Career-focused students finish and get placed." },
];

export type QualResult = {
  status: "qualified" | "conditional" | "disqualified";
  score: number;
  stops: string[]; // hard knockouts
  flags: string[]; // soft concerns
  affordability: "covered" | "affordable" | "stretch" | "not_affordable";
  next_step: string;
};

export function scoreQualification(a: QualAnswers): QualResult {
  const stops: string[] = [];
  const flags: string[] = [];

  // HARD STOPS — if any of these hit, we stop qualifying.
  if (a.age < 18) stops.push("Under 18 — not eligible for a CDL");
  if (!a.michigan_resident) stops.push("Not a Michigan resident");
  if (!a.valid_license) stops.push("No valid driver's license");
  if (a.dui_last_2y) stops.push("OWI/DUI or suspension in the last 2 years");
  if (!a.can_pass_dot) stops.push("Cannot pass DOT physical / drug test");
  if (!a.english_ok) stops.push("Does not meet FMCSA English proficiency");

  // AFFORDABILITY
  let affordability: QualResult["affordability"];
  const sponsored = a.funding === "gi_bill" || a.funding === "wioa" || a.funding === "employer";
  const months = 12;
  const remaining = Math.max(0, TUITION - a.savings);
  if (sponsored) affordability = "covered";
  else if (a.savings >= TUITION) affordability = "affordable";
  else if (a.monthly_budget * months >= remaining) affordability = "affordable";
  else if (a.monthly_budget >= 200 || a.savings >= 1000) affordability = "stretch";
  else affordability = "not_affordable";
  if (affordability === "not_affordable") {
    if (a.funding === "unsure") flags.push("No funding plan yet — screen for WIOA");
    else stops.push("Cannot afford tuition and no grant/sponsor path");
  }

  // POINTS (out of 100)
  let score = 0;
  score += a.age >= 21 ? 10 : 4;
  if (a.age < 21) flags.push("Age 18–20: Michigan intrastate only");
  score += a.license_years >= 1 ? 10 : 4;
  if (a.license_years < 1) flags.push("Under 1 year driving history");
  score += 15; // passed safety knockouts baseline
  score += { covered: 25, affordable: 22, stretch: 10, not_affordable: 0 }[affordability];
  if (affordability === "stretch") flags.push("Tight budget — confirm payment plan");
  score += { now: 15, "30d": 12, "90d": 6, later: 2 }[a.start_timeline];
  score += a.schedule_ok ? 10 : 0;
  if (!a.schedule_ok) flags.push("Schedule conflict for 4–7 week program");
  score += { career: 15, money: 10, exploring: 3 }[a.motivation];
  if (stops.length) score = Math.min(score, 30);

  const status: QualResult["status"] = stops.length
    ? "disqualified"
    : score >= 75 && flags.length <= 1
      ? "qualified"
      : "conditional";

  const next_step =
    status === "disqualified"
      ? "Stop. Politely close out and note the reason. Re-contact only if the situation changes."
      : status === "qualified"
        ? sponsored
          ? "Book campus tour and send funding paperwork (DD-214 / WIOA intake / employer letter)."
          : "Book campus tour and collect down payment to reserve a start date."
        : "Advisor call to resolve flags before booking.";

  return { status, score, stops, flags, affordability, next_step };
}
