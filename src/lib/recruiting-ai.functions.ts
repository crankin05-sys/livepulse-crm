import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({ studentId: z.string().uuid() });

// Recruiting AI: pairs near-graduation students with hiring carriers.
// Real backend effect: picks the best hiring carrier by openings x salary
// and inserts a real placement row (status='interviewing'), decrementing the
// carrier's open seats so the placement pipeline is auditable.
export const matchGraduate = createServerFn({ method: "POST" })
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

    const { data: student, error: sErr } = await context.supabase
      .from("students")
      .select("*")
      .eq("id", data.studentId)
      .single();
    if (sErr || !student) throw new Error(sErr?.message ?? "Student not found");

    const { data: carriers } = await context.supabase
      .from("carriers")
      .select("*")
      .eq("hiring", true)
      .gt("openings", 0)
      .order("avg_salary", { ascending: false })
      .limit(10);

    if (!carriers || carriers.length === 0) throw new Error("No hiring carriers available");

    // Skip carriers this student is already placed with.
    const { data: existing } = await context.supabase
      .from("placements")
      .select("carrier_id")
      .eq("student_id", data.studentId);
    const usedCarrierIds = new Set((existing ?? []).map((r) => r.carrier_id));
    const carrier = carriers.find((c) => !usedCarrierIds.has(c.id)) ?? carriers[0];

    const { error: pErr } = await context.supabase.from("placements").insert({
      student_id: student.id,
      carrier_id: carrier.id,
      student_name: student.full_name,
      carrier_name: carrier.name,
      status: "interviewing",
      salary: carrier.avg_salary,
    });
    if (pErr) throw new Error(pErr.message);

    // Decrement carrier openings so the pipeline stays accurate.
    await context.supabase
      .from("carriers")
      .update({ openings: Math.max((carrier.openings ?? 1) - 1, 0) })
      .eq("id", carrier.id);

    return {
      studentId: student.id,
      studentName: student.full_name,
      carrierId: carrier.id,
      carrierName: carrier.name,
      salary: Number(carrier.avg_salary ?? 0),
    };
  });
