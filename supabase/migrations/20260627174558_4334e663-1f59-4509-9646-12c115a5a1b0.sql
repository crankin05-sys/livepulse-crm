
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'instructor');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- New signups get a profile + admin role (this is an internal staff tool)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  program TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  score INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can submit leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff manage leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Staff delete leads" ON public.leads FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STUDENTS
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  program TEXT NOT NULL DEFAULT 'Class A CDL',
  cohort TEXT,
  instructor_name TEXT,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_completed NUMERIC NOT NULL DEFAULT 0,
  hours_required NUMERIC NOT NULL DEFAULT 160,
  progress_pct INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DOCUMENTS
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage documents" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- VEHICLES (fleet / live tracking)
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'Day Cab Tractor',
  driver_name TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  lat NUMERIC NOT NULL DEFAULT 41.88,
  lng NUMERIC NOT NULL DEFAULT -87.63,
  speed NUMERIC NOT NULL DEFAULT 0,
  location_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage vehicles" ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CARRIERS
CREATE TABLE public.carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  openings INT NOT NULL DEFAULT 0,
  locations TEXT,
  avg_salary NUMERIC,
  hiring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carriers TO authenticated;
GRANT ALL ON public.carriers TO service_role;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage carriers" ON public.carriers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PLACEMENTS
CREATE TABLE public.placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  student_name TEXT,
  carrier_name TEXT,
  status TEXT NOT NULL DEFAULT 'interviewing',
  salary NUMERIC,
  placed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placements TO authenticated;
GRANT ALL ON public.placements TO service_role;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage placements" ON public.placements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
