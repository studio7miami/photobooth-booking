CREATE TYPE public.booking_status AS ENUM (
  'draft','pending_agreement','agreement_signed','deposit_paid','paid_in_full',
  'confirmed','balance_due','settled','completed','cancelled','expired'
);

CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.agreement_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  content text NOT NULL,
  content_hash text NOT NULL,
  effective_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agreement_versions TO authenticated;
GRANT ALL ON public.agreement_versions TO service_role;
ALTER TABLE public.agreement_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view agreement versions" ON public.agreement_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status public.booking_status NOT NULL DEFAULT 'draft',
  client_name text,
  client_phone text,
  client_email text,
  event_location text,
  event_type text,
  event_date date,
  event_start_time time,
  duration_hours integer,
  station_count integer,
  experience text,
  base_cents integer,
  addl_hours integer,
  addl_rate_cents integer,
  total_cents integer,
  currency text NOT NULL DEFAULT 'usd',
  payment_mode text,
  deposit_cents integer,
  balance_cents integer,
  balance_due_date date,
  balance_status text,
  balance_link text,
  agreement_template_version text,
  agreement_content_hash text,
  agreement_signed boolean NOT NULL DEFAULT false,
  signature_value text,
  signer_name text,
  signed_at timestamptz,
  signer_ip text,
  signer_user_agent text,
  consent boolean NOT NULL DEFAULT false,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  executed_pdf_url text,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  amount_paid_cents integer NOT NULL DEFAULT 0,
  paid_at timestamptz,
  balance_payment_intent_id text,
  confirmation_sent_at timestamptz,
  confirmation_channels text[],
  concierge_agreement_sent_at timestamptz,
  concierge_channel text,
  concierge_status text,
  concierge_fallback_used boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_event_date ON public.bookings(event_date);
CREATE UNIQUE INDEX idx_bookings_payment_intent ON public.bookings(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
GRANT SELECT ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_state text,
  to_state text NOT NULL,
  actor text NOT NULL DEFAULT 'system',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_events_booking_id ON public.booking_events(booking_id);
GRANT SELECT ON public.booking_events TO authenticated;
GRANT ALL ON public.booking_events TO service_role;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view booking events" ON public.booking_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.agreement_versions (version, content, content_hash, effective_date)
VALUES ('v1','Studio 7 Miami Service Agreement v1 — see application template config for the rendered contract text.','seeded', current_date);