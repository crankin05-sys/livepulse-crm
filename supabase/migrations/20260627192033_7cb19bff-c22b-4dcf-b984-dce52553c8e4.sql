-- 1. Private schema for security helpers (NOT exposed via the Data API)
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Role-check helpers in the private schema.
--    SECURITY DEFINER so they can read user_roles, but kept out of the
--    API-exposed public schema and not executable by anon.
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','staff')
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated;

-- 3. Remove the public, API-exposed SECURITY DEFINER function from anon/authenticated reach.
--    public.has_role is no longer referenced by any policy or app code.
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 4. The auth trigger function is SECURITY DEFINER but must not be directly callable.
--    Triggers still fire because trigger execution does not check EXECUTE privilege.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 5. Replace permissive (USING true) policies with role-restricted ones.

-- LEADS ---------------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage leads" ON public.leads;
DROP POLICY IF EXISTS "Staff update leads" ON public.leads;
DROP POLICY IF EXISTS "Staff delete leads" ON public.leads;
DROP POLICY IF EXISTS "Auth can submit leads" ON public.leads;
DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;

-- Public lead capture (contact form + AI assistant via publishable key).
-- Not "always true": only brand-new leads may be created by the public.
CREATE POLICY "Public can submit leads" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (status = 'new');

CREATE POLICY "Staff read leads" ON public.leads
  FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));
CREATE POLICY "Staff insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "Staff update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "Staff delete leads" ON public.leads
  FOR DELETE TO authenticated
  USING (private.is_staff(auth.uid()));

-- STUDENTS ------------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage students" ON public.students;
CREATE POLICY "Staff manage students" ON public.students
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));

-- PAYMENTS ------------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage payments" ON public.payments;
CREATE POLICY "Staff manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));

-- DOCUMENTS -----------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage documents" ON public.documents;
CREATE POLICY "Staff manage documents" ON public.documents
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));

-- PLACEMENTS ----------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage placements" ON public.placements;
CREATE POLICY "Staff manage placements" ON public.placements
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));

-- CARRIERS ------------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage carriers" ON public.carriers;
CREATE POLICY "Staff manage carriers" ON public.carriers
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));

-- VEHICLES ------------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage vehicles" ON public.vehicles;
CREATE POLICY "Staff manage vehicles" ON public.vehicles
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));