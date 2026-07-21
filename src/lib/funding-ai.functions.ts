import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  program: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
});

export const FUNDING_PATHS = [
  "gi_bill",
  "wioa",
  "employer",
  "financing",
  "cash",
  "unknown",
] as const;
export type FundingPath = (typeof FUNDING_PATHS)[number];

export const FUNDING_LABEL: Record<FundingPath, string> = {
  gi_bill: "GI Bill / VA",
  wioa: "WIOA Grant",
  employer: "Employer Sponsored",
  financing: "Private Financing",
  cash: "Cash / Self-Pay",
  unknown: "Needs Discovery",
};

export const classifyFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roleRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "staff"])
      .limit(1);
    if (!Array.isArray(roleRows) || roleRows.length === 0) throw new Error("Forbidden");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are the Funding AI agent for U.S. Truck Driver Training School (Sterling Heights, MI). CDL tuition is $6,500. Funding paths available:
- gi_bill: veterans / active military using VA education benefits
- wioa: unemployed / underemployed Michigan residents eligible for Workforce Innovation & Opportunity Act
- employer: current employer sponsors the training (fleet, logistics company)
- financing: private student loan (Climb Credit, Meritize)
- cash: paying out of pocket / already has funds
- unknown: cannot determine from provided info

Classify the best-fit funding path for this lead. Never guarantee grants. Output ONLY JSON with keys:
- "path": one of gi_bill|wioa|employer|financing|cash|unknown
- "notes": one short sentence explaining the recommendation and next document/form to send

LEAD
Name: ${data.full_name}
Program: ${data.program ?? "Undecided"}
Message: ${data.message ?? "(none)"}`;

    const Result = z.object({
      path: z.enum(FUNDING_PATHS),
      notes: z.string().max(240),
    });

    const extractJson = (text: string) => {
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const body = fenced ? fenced[1] : text;
      const start = body.indexOf("{");
      const end = body.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("No JSON found");
      return JSON.parse(body.slice(start, end + 1));
    };

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });
    const result = Result.parse(extractJson(text));

    await context.supabase
      .from("leads")
      .update({ funding_path: result.path, funding_notes: result.notes })
      .eq("id", data.id);

    return result;
  });
