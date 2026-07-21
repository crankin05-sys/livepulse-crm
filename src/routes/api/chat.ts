import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { leadSummaryForPrompt } from "@/lib/lead-gen-demo";

type ChatRequestBody = { messages?: unknown };

const SYSTEM_PROMPT = `You are Stephanie, the senior admissions advisor for the U.S. Truck Driver Training School (USTDTS) — the #1 rated CDL school in the Midwest. You are warm, sharp, and genuinely helpful, like a top-performing human advisor who has placed thousands of drivers into great careers.

ABOUT THE SCHOOL
- Accredited, FMCSA ELDT-compliant CDL training in Sterling Heights, MI (6500 15 Mile Rd., Sterling Heights, MI 48312). Phone 586-838-1268, email info@ustdts.edu. Third-party CDL skills testing facility for the State of Michigan; founded in 1994, 25+ years in business.
- 12,000+ drivers trained, 94% job-placement rate, 40+ hiring carrier partners (Schneider, Werner, J.B. Hunt, Knight-Swift, Prime Inc., Roehl, C.R. England, U.S. Xpress, Covenant, Marten).
- Live GPS fleet tracking is used in training.
- SERVICE AREA: We train students who live in Michigan. Prioritize and qualify Michigan-based students (Metro Detroit, Macomb, Oakland, Wayne, Genesee counties, etc.). If someone is out of state, politely note that our campus and programs serve Michigan residents and that they'd need to attend in person in Sterling Heights, MI.

PROGRAMS
- Class A CDL — tractor-trailers up to 80,000 lbs; over-the-road & regional careers; 4–7 weeks. Highest earning potential and most in-demand.
- Class B CDL — straight trucks, box trucks, buses; local routes, home-every-night; 3–4 weeks.
- Third-Party Skills Exam — official on-site CDL road test with state-certified examiners; 1 day. For people already trained.

FUNDING
- GI Bill, WIOA grants, employer sponsorship, and flexible payment plans. Tuition includes range & road hours, ELDT theory, permit/endorsement prep, job-placement & carrier interview prep, and lifetime career services.

HOW YOU HELP
1. Answer questions clearly and concisely about programs, financing, schedule, eligibility, and careers.
2. Recommend the right program. Ask 1–2 quick questions about their goals (home time vs. travel, timeline, budget, prior experience) and recommend Class A, Class B, or the Skills Exam with a short reason.
3. Capture leads: once someone shows interest, naturally collect their name, email, and phone, then call the save_lead tool. Confirm warmly after saving.
4. Book a call or campus tour: when someone wants to talk to an advisor or visit, collect name + phone + preferred time and call the book_appointment tool.

AI LEAD ENGINE & CURRENT PIPELINE
- Our AI Lead Generation Agent sources leads from MICHIGAN ONLY (Google Maps, Instagram, Facebook, LinkedIn). We never source or pursue out-of-state leads.
- Live pipeline snapshot you can reference when asked: ${leadSummaryForPrompt()}
- If asked about the current leads, summarize from this snapshot (counts, cities, hottest prospects). Don't invent leads beyond it.

STYLE
- Keep replies short and scannable. Use plain language. One question at a time.
- Be encouraging but never pushy or fake. Never invent prices you don't know — offer to connect them with an advisor instead.
- After you successfully save a lead or appointment, tell the user clearly and what happens next (an advisor reaches out within one business day).`;

function getSupabase() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
          stopWhen: stepCountIs(8),
          tools: {
            save_lead: tool({
              description:
                "Save a prospective student as a lead in the CRM once they have shown interest and shared at least their name and email. Use the program they are most interested in if known.",
              inputSchema: z.object({
                full_name: z.string().min(1).max(120).describe("Prospect's full name"),
                email: z.string().email().max(200).describe("Prospect's email address"),
                phone: z.string().max(40).optional().describe("Phone number if provided"),
                program: z
                  .enum(["Class A CDL", "Class B CDL", "Third-Party Skills Exam", "Undecided"])
                  .optional()
                  .describe("Program of interest"),
                notes: z
                  .string()
                  .max(800)
                  .optional()
                  .describe("Short summary of their goals and situation"),
              }),
              execute: async ({ full_name, email, phone, program, notes }) => {
                const supabase = getSupabase();
                const { error } = await supabase.from("leads").insert({
                  full_name,
                  email,
                  phone: phone ?? null,
                  program: program ?? null,
                  message: notes ?? null,
                  source: "ai_assistant",
                  status: "new",
                  score: 70,
                });
                if (error) {
                  return { success: false, message: "Could not save right now." };
                }
                return {
                  success: true,
                  message: `Lead saved for ${full_name}. An advisor will follow up within one business day.`,
                };
              },
            }),
            book_appointment: tool({
              description:
                "Book a real appointment (phone call or campus tour) on the school's calendar. Requires name, phone, and a scheduled_at ISO timestamp. Convert the user's stated preferred time (e.g. 'tomorrow 3pm', 'Friday at 10') into an ISO timestamp in America/Detroit before calling. Business hours: Mon–Fri 8am–6pm, Sat by appointment.",
              inputSchema: z.object({
                full_name: z.string().min(1).max(120),
                phone: z.string().min(5).max(40),
                email: z.string().email().max(200).optional(),
                appt_type: z.enum(["phone_call", "campus_tour"]).describe("phone_call or campus_tour"),
                scheduled_at: z
                  .string()
                  .describe("ISO 8601 timestamp (America/Detroit), e.g. 2026-07-22T15:00:00-04:00"),
                duration_minutes: z.number().int().min(15).max(120).default(20),
                program: z
                  .enum(["Class A CDL", "Class B CDL", "Third-Party Skills Exam", "Undecided"])
                  .optional(),
                notes: z.string().max(600).optional(),
              }),
              execute: async ({
                full_name,
                phone,
                email,
                appt_type,
                scheduled_at,
                duration_minutes,
                program,
                notes,
              }) => {
                const supabase = getSupabase();
                // 1. Create/attach a lead record
                const leadEmail = email ?? `${phone.replace(/\D/g, "")}@booking.ustdts.edu`;
                const { data: leadRow } = await supabase
                  .from("leads")
                  .insert({
                    full_name,
                    email: leadEmail,
                    phone,
                    program: program ?? null,
                    message: notes ?? `${appt_type} booked via Stephanie`,
                    source: "ai_booking",
                    status: "new",
                    score: 85,
                  })
                  .select("id")
                  .single();

                // 2. Create the real appointment
                const { error: apptErr } = await supabase.from("appointments").insert({
                  lead_id: leadRow?.id ?? null,
                  full_name,
                  phone,
                  email: email ?? null,
                  program: program ?? null,
                  appt_type,
                  scheduled_at,
                  duration_minutes: duration_minutes ?? 20,
                  notes: notes ?? null,
                  source: "ai_agent",
                  status: "scheduled",
                });
                if (apptErr) {
                  return {
                    success: false,
                    message: `Could not book that slot: ${apptErr.message}`,
                  };
                }
                const when = new Date(scheduled_at).toLocaleString("en-US", {
                  timeZone: "America/Detroit",
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                });
                const kind = appt_type === "campus_tour" ? "Campus tour" : "Phone call";
                return {
                  success: true,
                  message: `${kind} booked for ${full_name} on ${when} ET. An advisor will confirm shortly at ${phone}.`,
                  scheduled_at,
                };
              },
            }),
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
