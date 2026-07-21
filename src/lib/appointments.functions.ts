import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const APPT_TYPES = ["phone_call", "campus_tour", "skills_exam"] as const;
export const APPT_STATUSES = [
  "scheduled",
  "confirmed",
  "completed",
  "no_show",
  "cancelled",
] as const;

export type ApptType = (typeof APPT_TYPES)[number];
export type ApptStatus = (typeof APPT_STATUSES)[number];

export const APPT_TYPE_LABEL: Record<ApptType, string> = {
  phone_call: "Phone call",
  campus_tour: "Campus tour",
  skills_exam: "Skills exam",
};

export const APPT_STATUS_LABEL: Record<ApptStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

const BookInput = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().min(5).max(40),
  email: z.string().email().max(200).optional().nullable(),
  program: z.string().max(80).optional().nullable(),
  appt_type: z.enum(APPT_TYPES).default("phone_call"),
  scheduled_at: z.string().describe("ISO datetime string"),
  duration_minutes: z.number().int().min(10).max(240).default(30),
  notes: z.string().max(1000).optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  source: z.string().max(40).default("staff_manual"),
});

export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => BookInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("appointments")
      .insert({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email ?? null,
        program: data.program ?? null,
        appt_type: data.appt_type,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes,
        notes: data.notes ?? null,
        lead_id: data.lead_id ?? null,
        source: data.source,
        status: "scheduled",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(APPT_STATUSES),
});

export const updateAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UpdateInput.parse(data))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const patch = {
      status: data.status,
      confirmed_at: data.status === "confirmed" ? now : null,
      completed_at: data.status === "completed" ? now : null,
    };
    const { error } = await context.supabase
      .from("appointments")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
