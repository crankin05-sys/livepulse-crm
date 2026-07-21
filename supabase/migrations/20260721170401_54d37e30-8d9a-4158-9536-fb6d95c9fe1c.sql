
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  audience_size int NOT NULL DEFAULT 0,
  budget numeric NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  leads_generated int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage campaigns"
  ON public.campaigns FOR ALL
  TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.campaigns (name, channel, status, audience_size, budget, spend, leads_generated, notes) VALUES
('Michigan Works Fall Push', 'facebook', 'active', 12500, 2500, 1820, 34, 'Metro Detroit + Macomb County retargeting'),
('Metro Detroit Google Search', 'google', 'active', 8400, 1800, 1360, 22, 'CDL keywords, Sterling Heights radius'),
('Veterans GI Bill Reactivation', 'email', 'active', 640, 200, 92, 11, 'Cold list of MI veterans'),
('Ex-Truckers SMS Reactivation', 'sms', 'paused', 2200, 500, 0, 0, 'Awaiting compliance review');
