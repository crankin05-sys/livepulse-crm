import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LeadInput = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  program: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  status: z.string(),
  score: z.number(),
  source: z.string(),
});

// AI-judged intent -> persisted lead score, so the hot/warm/cold classification is real.
const INTENT_SCORE: Record<"hot" | "warm" | "cold", number> = { hot: 90, warm: 65, cold: 35 };

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

    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are the AI co-pilot for the admissions team at U.S. Truck Driver Training School (CDL school in Sterling Heights, MI; programs: Class A CDL, Class B CDL, Third-Party Skills Exam; funding via GI Bill, WIOA, payment plans; 94% placement). The school only serves students located in Michigan, so treat Michigan-based leads as the priority and factor location into intent.

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

Return ONLY a JSON object (no markdown, no commentary) with exactly these keys:
- "summary": 2-3 sentence summary of who this lead is and their intent
- "intent": one of "hot", "warm", or "cold" (how ready to enroll)
- "next_action": one concrete next step for the advisor
- "draft_reply": a friendly, professional follow-up email body (under 120 words) that moves them toward enrolling or booking a call`;

    const Result = z.object({
      summary: z.string(),
      intent: z.enum(["hot", "warm", "cold"]),
      next_action: z.string(),
      draft_reply: z.string(),
    });

    const extractJson = (text: string) => {
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const body = fenced ? fenced[1] : text;
      const start = body.indexOf("{");
      const end = body.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("No JSON found in AI response");
      return JSON.parse(body.slice(start, end + 1));
    };

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
      });
      return Result.parse(extractJson(text));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI request failed";
      throw new Error(msg);
    }
  });
