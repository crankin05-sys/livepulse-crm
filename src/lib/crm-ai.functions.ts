import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LeadInput = z.object({
  full_name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  program: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  status: z.string(),
  score: z.number(),
  source: z.string(),
});

export const analyzeLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => LeadInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roleRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "staff"])
      .limit(1);
    const isAdmin = Array.isArray(roleRows) && roleRows.length > 0;
    if (!isAdmin) throw new Error("Forbidden");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { generateText, Output } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are the AI co-pilot for the admissions team at U.S. Truck Driver Training School (CDL school in Sterling Heights, MI; programs: Class A CDL, Class B CDL, Third-Party Skills Exam; funding via GI Bill, WIOA, payment plans; 94% placement).

Analyze this lead and help the advisor act fast.

LEAD
Name: ${data.full_name}
Email: ${data.email}
Phone: ${data.phone ?? "—"}
Program interest: ${data.program ?? "Undecided"}
Source: ${data.source}
Current status: ${data.status}
Lead score: ${data.score}
Message/notes: ${data.message ?? "(none)"}

Write a friendly, professional follow-up email draft (under 120 words) that moves them toward enrolling or booking a call.`;

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        output: Output.object({
          schema: z.object({
            summary: z.string().describe("2-3 sentence summary of who this lead is and intent"),
            intent: z.enum(["hot", "warm", "cold"]).describe("How ready to enroll"),
            next_action: z.string().describe("One concrete next step for the advisor"),
            draft_reply: z.string().describe("Ready-to-send follow-up email body"),
          }),
        }),
        prompt,
      });
      return output;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI request failed";
      throw new Error(msg);
    }
  });
