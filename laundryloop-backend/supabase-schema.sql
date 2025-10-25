-- Supabase schema for LaundryLoop backend
-- This SQL script defines tables, relationships, constraints and sample seed data
-- required to support a zone‑based laundry pickup and scheduling platform.

-- Enable extension for UUID generation if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Zones define pickup regions and their daily capacity
CREATE TABLE public.zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  capacity_per_day INTEGER NOT NULL CHECK (capacity_per_day > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders represent customer pickup requests.  Each order references a zone and
-- optionally the authenticated user placing the order.  Overflow orders
-- indicate that the request exceeds the zone's daily capacity and may be
-- subject to an upcharge.  Express orders indicate same‑day or expedited
-- service and are also subject to an upcharge.
CREATE TYPE public.order_status AS ENUM (
  'pending',       -- order created but not yet confirmed/paid
  'confirmed',     -- payment received and scheduled
  'in_progress',   -- order is being processed (e.g., at laundry facility)
  'completed',     -- order finished and returned to customer
  'cancelled'      -- order cancelled by user or admin
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  zone_id INTEGER REFERENCES public.zones(id) ON DELETE RESTRICT,
  pickup_date DATE NOT NULL,
  -- optional time slot identifier or window; can be extended later
  pickup_slot TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  is_express BOOLEAN NOT NULL DEFAULT FALSE,
  is_overflow BOOLEAN NOT NULL DEFAULT FALSE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ledger tracks financial transactions related to orders, including the
-- allocation of $2.50 per order into a bonus pool.  Positive amounts
-- represent revenue; negative amounts represent refunds or adjustments.
CREATE TABLE public.ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  type TEXT NOT NULL, -- e.g., 'order', 'bonus_pool', 'refund'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sample seed data for zones
INSERT INTO public.zones (name, capacity_per_day)
VALUES
  ('North End', 25),
  ('Downtown', 30),
  ('West Boise', 20);
