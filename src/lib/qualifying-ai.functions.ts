import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { scoreQualification } from "@/lib/qualification";

const Answers = z.object({
  age: z.number().int().min(0).max(100),
  michigan_resident: z.boolean(),
  valid_license: z.boolean(),
  license_years: z.number().min(0).max(80),
  dui_last_2y: z.boolean(),
  can_pass_dot: z.boolean(),
  english_ok: z.boolean(),
  funding: z.enum(["gi_bill", "wioa", "employer", "financing", "cash", "unsure"]),
  monthly_budget: z.number().min(0).max(100000),
  savings: z.number().min(0).max(1000000),
  start_timeline: z.enum(["now", "30d", "90d", "later"]),
  schedule_ok: z.boolean(),
  motivation: z.enum(["career", "money", "exploring"]),
});

const Input = z.object({ id: z.string().uuid(), answers: Answers });

export const qualifyLead = createServerFn({ method: "POST" })
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

    // Scoring runs on the server so the result can't be faked from the browser.
    const result = scoreQualification(data.answers);
    const notes = [...result.stops, ...result.flags].join(" · ") || "All checks passed";
    const update: Record<string, unknown> = {
      qualification_status: result.status,
      qualification_score: result.score,
      qualification_answers: data.answers,
      qualification_notes: `${notes} → ${result.next_step}`,
      qualified_at: new Date().toISOString(),
      score: result.score,
    };
    if (result.status === "qualified") update.status = "qualified";
    if (result.status === "disqualified") update.status = "rejected";

    const { error } = await context.supabase
      .from("leads")
      .update(update as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return result;
  });
