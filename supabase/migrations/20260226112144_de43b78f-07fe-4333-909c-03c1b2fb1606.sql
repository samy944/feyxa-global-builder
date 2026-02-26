
-- Table for abandoned carts
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'abandoned',
  recovery_code TEXT,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Vendors can see abandoned carts for their stores
CREATE POLICY "Store members can view abandoned carts"
ON public.abandoned_carts FOR SELECT
USING (public.is_store_member(store_id, auth.uid()));

-- Store members can update (for recovery status)
CREATE POLICY "Store members can update abandoned carts"
ON public.abandoned_carts FOR UPDATE
USING (public.is_store_member(store_id, auth.uid()));

-- Anyone can insert (from checkout, may not be logged in)
CREATE POLICY "Anyone can insert abandoned carts"
ON public.abandoned_carts FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for store lookups
CREATE INDEX idx_abandoned_carts_store_status ON public.abandoned_carts(store_id, status);
