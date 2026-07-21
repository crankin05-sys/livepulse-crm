import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import type { Tables } from "../integrations/supabase/types";

export type Lead = Tables<"leads">;
export type Student = Tables<"students">;
export type Vehicle = Tables<"vehicles">;
export type Carrier = Tables<"carriers">;
export type Placement = Tables<"placements">;
export type Payment = Tables<"payments">;
export type DocumentRow = Tables<"documents">;
export type Appointment = Tables<"appointments">;

async function must<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const leadsQuery = queryOptions({
  queryKey: ["leads"],
  queryFn: () => must<Lead[]>(supabase.from("leads").select("*").order("created_at", { ascending: false })),
});

export const studentsQuery = queryOptions({
  queryKey: ["students"],
  queryFn: () => must<Student[]>(supabase.from("students").select("*").order("progress_pct", { ascending: false })),
});

export const vehiclesQuery = queryOptions({
  queryKey: ["vehicles"],
  queryFn: () => must<Vehicle[]>(supabase.from("vehicles").select("*").order("unit_number")),
});

export const carriersQuery = queryOptions({
  queryKey: ["carriers"],
  queryFn: () => must<Carrier[]>(supabase.from("carriers").select("*").order("openings", { ascending: false })),
});

export const placementsQuery = queryOptions({
  queryKey: ["placements"],
  queryFn: () => must<Placement[]>(supabase.from("placements").select("*").order("created_at", { ascending: false })),
});

export const paymentsQuery = queryOptions({
  queryKey: ["payments"],
  queryFn: () => must<Payment[]>(supabase.from("payments").select("*").order("due_date", { ascending: false })),
});

export const documentsQuery = queryOptions({
  queryKey: ["documents"],
  queryFn: () => must<DocumentRow[]>(supabase.from("documents").select("*")),
});

export const appointmentsQuery = queryOptions({
  queryKey: ["appointments"],
  queryFn: () =>
    must<Appointment[]>(
      supabase.from("appointments").select("*").order("scheduled_at", { ascending: true }),
    ),
});
