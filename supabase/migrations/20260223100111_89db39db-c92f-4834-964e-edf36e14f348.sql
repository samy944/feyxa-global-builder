
-- Add 'dispute' to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'dispute';

-- Create return_status enum
CREATE TYPE public.return_status AS ENUM ('requested', 'reviewing', 'approved', 'rejected', 'received', 'refunded');

-- Create return_requests table
CREATE TABLE public.return_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  product_id uuid REFERENCES public.products(id),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id),
  reason text NOT NULL,
  description text,
  images jsonb DEFAULT '[]'::jsonb,
  status public.return_status NOT NULL DEFAULT 'requested',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Buyers create return requests"
  ON public.return_requests FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers read own returns"
  ON public.return_requests FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Store members read store returns"
  ON public.return_requests FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

CREATE POLICY "Store members update returns"
  ON public.return_requests FOR UPDATE
  USING (is_store_member(store_id, auth.uid()));

CREATE POLICY "Marketplace admins read all returns"
  ON public.return_requests FOR SELECT
  USING (has_role(auth.uid(), 'marketplace_admin'));

CREATE POLICY "Marketplace admins update returns"
  ON public.return_requests FOR UPDATE
  USING (has_role(auth.uid(), 'marketplace_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_return_requests_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_requests;
