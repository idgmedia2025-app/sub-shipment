
-- ============================================
-- GOBRAS SHIPMENT HUB — FULL DATABASE SCHEMA
-- ============================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  customer_id UUID REFERENCES public.customers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 5. Invites table
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
  customer_id UUID REFERENCES public.customers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Shipments table
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  type TEXT NOT NULL CHECK (type IN ('air', 'sea', 'land')),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  cargo_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'warehouse', 'in_transit', 'arrived', 'delivered')),
  eta_date DATE,
  notes TEXT,
  weight_kg NUMERIC,
  volumetric_weight NUMERIC,
  length_cm NUMERIC,
  width_cm NUMERIC,
  height_cm NUMERIC,
  container_type TEXT CHECK (container_type IN ('20ft', '40ft', 'LCL') OR container_type IS NULL),
  volume_cbm NUMERIC,
  vehicle_type TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- 8. Tracking events table
CREATE TABLE public.tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_time TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  language TEXT NOT NULL,
  service TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  customer_id UUID REFERENCES public.customers(id),
  lead_id UUID REFERENCES public.leads(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Invoice sequences
CREATE SEQUENCE IF NOT EXISTS public.proforma_invoice_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.commercial_invoice_seq START 1;

-- 11. Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('proforma', 'commercial')),
  proforma_no TEXT UNIQUE,
  commercial_no TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  shipment_id UUID REFERENCES public.shipments(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  currency TEXT NOT NULL DEFAULT 'USD',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_from_invoice_id UUID REFERENCES public.invoices(id),
  converted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
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

-- is_staff helper (admin or moderator)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'moderator')
  )
$$;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate invoice number RPC
CREATE OR REPLACE FUNCTION public.generate_invoice_number(_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _year TEXT;
  _seq BIGINT;
  _prefix TEXT;
BEGIN
  _year := EXTRACT(YEAR FROM now())::TEXT;
  IF _type = 'proforma' THEN
    _seq := nextval('public.proforma_invoice_seq');
    _prefix := 'PI';
  ELSIF _type = 'commercial' THEN
    _seq := nextval('public.commercial_invoice_seq');
    _prefix := 'INV';
  ELSE
    RAISE EXCEPTION 'Invalid invoice type: %', _type;
  END IF;
  RETURN _prefix || '-' || _year || '-' || LPAD(_seq::TEXT, 6, '0');
END;
$$;

-- Create appointment and customer RPC (public/anon callable)
CREATE OR REPLACE FUNCTION public.create_appointment_and_customer(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id UUID;
  _lead_id UUID;
  _appointment_id UUID;
  _email TEXT;
  _name TEXT;
  _phone TEXT;
  _company TEXT;
BEGIN
  _name := payload->>'name';
  _email := lower(trim(payload->>'email'));
  _phone := payload->>'phone';
  _company := payload->>'company';

  -- Upsert customer by email
  INSERT INTO public.customers (name, email, phone, company)
  VALUES (_name, _email, _phone, _company)
  ON CONFLICT (email) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, public.customers.phone),
    company = COALESCE(EXCLUDED.company, public.customers.company),
    updated_at = now()
  RETURNING id INTO _customer_id;

  -- Create lead
  INSERT INTO public.leads (name, email, phone, company, status, customer_id)
  VALUES (_name, _email, _phone, _company, 'new', _customer_id)
  RETURNING id INTO _lead_id;

  -- Create appointment
  INSERT INTO public.appointments (name, email, phone, company, preferred_date, preferred_time, language, service, message, customer_id, lead_id)
  VALUES (
    _name, _email, _phone, _company,
    (payload->>'preferred_date')::DATE,
    (payload->>'preferred_time')::TIME,
    payload->>'language',
    payload->>'service',
    payload->>'message',
    _customer_id, _lead_id
  )
  RETURNING id INTO _appointment_id;

  -- Link profile if auth user with same email exists
  UPDATE public.profiles SET customer_id = _customer_id WHERE lower(email) = _email AND customer_id IS NULL;

  RETURN jsonb_build_object(
    'appointment_id', _appointment_id,
    'lead_id', _lead_id,
    'customer_id', _customer_id,
    'message', 'Appointment created successfully'
  );
END;
$$;

-- Public tracking RPC
CREATE OR REPLACE FUNCTION public.get_public_tracking(_tracking_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _shipment RECORD;
  _events JSONB;
BEGIN
  SELECT id, tracking_number, status, origin, destination, type, eta_date
  INTO _shipment
  FROM public.shipments
  WHERE tracking_number = upper(trim(_tracking_number)) AND is_deleted = false;

  IF _shipment IS NULL THEN
    RETURN jsonb_build_object('found', false, 'message', 'No shipment found with that tracking number');
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'event_time', te.event_time,
      'location', te.location,
      'description', te.description,
      'status', te.status
    ) ORDER BY te.event_time DESC
  ), '[]'::jsonb)
  INTO _events
  FROM (
    SELECT event_time, location, description, status
    FROM public.tracking_events
    WHERE shipment_id = _shipment.id
    ORDER BY event_time DESC
    LIMIT 5
  ) te;

  RETURN jsonb_build_object(
    'found', true,
    'tracking_number', _shipment.tracking_number,
    'status', _shipment.status,
    'origin', _shipment.origin,
    'destination', _shipment.destination,
    'type', _shipment.type,
    'eta_date', _shipment.eta_date,
    'events', _events
  );
END;
$$;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_staff(auth.uid()));

-- USER ROLES
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- INVITES
CREATE POLICY "Admins can manage invites" ON public.invites FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own invite" ON public.invites FOR SELECT TO authenticated USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

-- CUSTOMERS
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Users can view own customer" ON public.customers FOR SELECT TO authenticated USING (
  id = (SELECT customer_id FROM public.profiles WHERE user_id = auth.uid())
);

-- LEADS
CREATE POLICY "Staff can manage leads" ON public.leads FOR ALL TO authenticated USING (public.is_staff(auth.uid()));

-- SHIPMENTS
CREATE POLICY "Staff can manage shipments" ON public.shipments FOR ALL TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Users can view own shipments" ON public.shipments FOR SELECT TO authenticated USING (
  customer_id = (SELECT customer_id FROM public.profiles WHERE user_id = auth.uid())
);

-- TRACKING EVENTS
CREATE POLICY "Staff can manage tracking events" ON public.tracking_events FOR ALL TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Users can view own tracking events" ON public.tracking_events FOR SELECT TO authenticated USING (
  shipment_id IN (
    SELECT id FROM public.shipments WHERE customer_id = (SELECT customer_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- APPOINTMENTS
CREATE POLICY "Staff can manage appointments" ON public.appointments FOR ALL TO authenticated USING (public.is_staff(auth.uid()));

-- INVOICES
CREATE POLICY "Staff can view all invoices" ON public.invoices FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update draft invoices" ON public.invoices FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()) AND status = 'draft');
CREATE POLICY "Staff can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT TO authenticated USING (
  customer_id = (SELECT customer_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Grant anon execute on public RPCs for public booking/tracking
GRANT EXECUTE ON FUNCTION public.create_appointment_and_customer(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.create_appointment_and_customer(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_tracking(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_tracking(TEXT) TO authenticated;
