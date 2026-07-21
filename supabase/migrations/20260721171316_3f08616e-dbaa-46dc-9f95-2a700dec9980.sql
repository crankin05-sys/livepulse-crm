
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  program text,
  appt_type text NOT NULL DEFAULT 'phone_call',
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  source text NOT NULL DEFAULT 'ai_agent',
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX appointments_scheduled_at_idx ON public.appointments (scheduled_at);
CREATE INDEX appointments_status_idx ON public.appointments (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view appointments" ON public.appointments
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "Staff insert appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "Staff update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "Staff delete appointments" ON public.appointments
  FOR DELETE TO authenticated USING (private.is_staff(auth.uid()));

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
