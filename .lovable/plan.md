# AI Lead Generation Agent Demo

A fully client-side, timer-driven demo that makes the CRM look like a live AI lead engine working Michigan. No database writes — everything runs in the browser so it always looks alive in a sales demo.

## 1. Demo data module — `src/lib/lead-gen-demo.ts` (new)

A single source of truth for the simulation:

- **`DEMO_LEADS`** — ~12 realistic Michigan CDL leads. Cities: Detroit, Sterling Heights, Flint, Grand Rapids, Lansing, Warren, Ann Arbor, Kalamazoo. Each has: full name, city, phone (correct MI area codes — 313/586/810/616/517/734/269/248), email, program (Class A / Class B / Skills Exam), `source` (Google Maps, Instagram, Facebook, LinkedIn), `score` 60–95, `status` (new / contacted / qualified), and a relative "received" time. Shaped to match the existing `LeadRow` type so they render in the current table.
- **`ACTIVITY_TEMPLATES`** — rotating feed lines (lead found, outreach SMS sent, lead qualified + GI Bill, campus tour booked) with emoji, randomized Michigan names + cities + scores.
- **`AGENTS`** — Lead-Gen ("Scraping Michigan — 142 leads today"), Outreach ("Sending SMS/email — 38 today"), Qualifier ("Scoring leads — 27 qualified"), Booking ("Standby"), each with a base counter and per-tick increment.
- Helper to format a timestamp into "just now" → "5s ago" → "2m ago".

## 2. Live components

- **`src/components/crm/LeadActivityFeed.tsx`** (new) — card titled "Lead Agent · Live Activity". Adds a new entry every 4–6s (randomized) via `setTimeout` loop, newest on top, caps the list length, and re-renders every second so timestamps age. Uses `cc-card` dark styling to match the control-center look.
- **`src/components/crm/AgentStatusCards.tsx`** (new) — the four agent cards with green pulsing "Active" dots (Booking shows amber "Standby"), live counters that tick up on an interval, matching `cc-card`/glow styling.

## 3. Leads page — `src/routes/_app/leads.tsx`

- Merge `DEMO_LEADS` into the displayed rows (prepended) so the list is always populated with the Michigan leads regardless of DB state. Search/filter/status/Analyze keep working on the merged rows.
- Add the **Agent Status Cards** row and the **Live Activity Feed** above the leads table.

## 4. "● Live" badge — `src/routes/_app.tsx`

Add a pulsing green "● Live" badge into the CRM top header bar.

## 5. Stephanie awareness — `src/routes/api/chat.ts`

Extend the system prompt so Stephanie: (a) states the AI lead engine sources **Michigan-only** leads, and (b) can answer about the current pipeline — embed a compact summary of the demo leads (counts by city/status, hottest leads) so she can reference them without a backend call.

## Technical notes

- Pure client-side simulation: `setInterval`/`setTimeout` with cleanup in `useEffect`; all timers and random picks run only in the browser (guard against SSR by initializing state in effects, mirroring the existing `ControlHeader` pattern) to avoid hydration mismatches.
- No schema or RLS changes; no inserts. The demo leads exist only in the client view.
- Reuses existing `cc-card`, `cc-card-glow`, and `animate-pulse` utilities — no new global CSS needed.
