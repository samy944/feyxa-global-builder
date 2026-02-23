
-- Table: delivery_confirmations
CREATE TABLE public.delivery_confirmations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at timestamp with time zone,
  confirmed_by uuid,
  method text NOT NULL DEFAULT 'qr' CHECK (method IN ('qr', 'otp')),
  otp_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_delivery_confirmations_order_id ON public.delivery_confirmations(order_id);
CREATE INDEX idx_delivery_confirmations_token_hash ON public.delivery_confirmations(token_hash);
CREATE INDEX idx_delivery_confirmations_store_id ON public.delivery_confirmations(store_id);

-- RLS
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;

-- Store members can insert/read
CREATE POLICY "Store members manage delivery confirmations"
  ON public.delivery_confirmations FOR ALL
  USING (is_store_member(store_id, auth.uid()))
  WITH CHECK (is_store_member(store_id, auth.uid()));

-- Marketplace admins can read all
CREATE POLICY "Marketplace admins read delivery confirmations"
  ON public.delivery_confirmations FOR SELECT
  USING (has_role(auth.uid(), 'marketplace_admin'));

-- Buyers can read their own (via customers)
CREATE POLICY "Buyers read own delivery confirmations"
  ON public.delivery_confirmations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE o.id = delivery_confirmations.order_id
        AND c.user_id = auth.uid()
    )
  );

-- Anon can read by token_hash (for public confirmation page - handled via edge function instead)
-- We keep RLS strict; edge function uses service role
