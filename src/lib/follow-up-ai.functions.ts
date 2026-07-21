import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({ leadId: z.string().uuid() });

// Follow-Up AI: reaches out to stale leads. Real backend effect: generates a
// personalized outreach message via Gemini, bumps the lead's status to
// "contacted", and stores the drafted message in the lead's `message` field
// so advisors can see exactly what the agent sent.
export const sendFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roleRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "staff"])
      .limit(1);
    if (!roleRows || roleRows.length === 0) throw new Error("Forbidden");

    const { data: lead, error } = await context.supabase
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .single();
    if (error || !lead) throw new Error(error?.message ?? "Lead not found");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are the Follow-Up AI for U.S. Truck Driver Training School (Sterling Heights, MI, 586-838-1268). Write ONE short SMS follow-up (<= 320 characters, warm, no emojis, no markdown) to re-engage this stale lead and get them on a call. Reference their program interest if any. Sign off: "— Stephanie, USTDTS".

Lead: ${lead.full_name}
Program: ${lead.program ?? "Undecided"}
Source: ${lead.source}
Status: ${lead.status}
Last message: ${lead.message ?? "(none)"}
Return only the SMS body text.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });
    const sms = text.trim().slice(0, 320);

    await context.supabase
      .from("leads")
      .update({ status: "contacted", message: sms })
      .eq("id", data.leadId);

    return { leadId: data.leadId, sms };
  });
