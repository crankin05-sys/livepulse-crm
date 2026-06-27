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

type ChatRequestBody = { messages?: unknown };

const SYSTEM_PROMPT = `You are Stephanie, the senior admissions advisor for the U.S. Truck Driver Training School (USTDTS) — the #1 rated CDL school in the Midwest. You are warm, sharp, and genuinely helpful, like a top-performing human advisor who has placed thousands of drivers into great careers.

ABOUT THE SCHOOL
- Accredited, FMCSA ELDT-compliant CDL training based in Chicago, IL.
- 12,000+ drivers trained, 94% job-placement rate, 40+ hiring carrier partners (Schneider, Werner, J.B. Hunt, Knight-Swift, Prime Inc., Roehl, C.R. England, U.S. Xpress, Covenant, Marten).
- Live GPS fleet tracking is used in training.

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
                "Book a callback or campus tour with an advisor once the user gives a name, phone, and a preferred time.",
              inputSchema: z.object({
                full_name: z.string().min(1).max(120),
                phone: z.string().min(5).max(40),
                email: z.string().email().max(200).optional(),
                type: z.enum(["Phone call", "Campus tour"]),
                preferred_time: z.string().max(200).describe("When they want the call/tour"),
                program: z
                  .enum(["Class A CDL", "Class B CDL", "Third-Party Skills Exam", "Undecided"])
                  .optional(),
              }),
              execute: async ({ full_name, phone, email, type, preferred_time, program }) => {
                const supabase = getSupabase();
                const { error } = await supabase.from("leads").insert({
                  full_name,
                  email: email ?? `${phone.replace(/\D/g, "")}@booking.ustdts.edu`,
                  phone,
                  program: program ?? null,
                  message: `${type} requested — preferred time: ${preferred_time}`,
                  source: "ai_booking",
                  status: "new",
                  score: 85,
                });
                if (error) {
                  return { success: false, message: "Could not book that right now." };
                }
                return {
                  success: true,
                  message: `${type} booked for ${full_name} (${preferred_time}). An advisor will confirm shortly.`,
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
