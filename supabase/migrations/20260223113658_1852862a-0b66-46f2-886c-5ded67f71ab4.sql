
-- Table: delivery_proofs
CREATE TABLE public.delivery_proofs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  courier_id uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: delivery_proof_files
CREATE TABLE public.delivery_proof_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proof_id uuid NOT NULL REFERENCES public.delivery_proofs(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  mime_type text NOT NULL DEFAULT 'image/jpeg',
  size integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_delivery_proofs_order_id ON public.delivery_proofs(order_id);
CREATE INDEX idx_delivery_proofs_store_id ON public.delivery_proofs(store_id);
CREATE INDEX idx_delivery_proof_files_proof_id ON public.delivery_proof_files(proof_id);

-- RLS on delivery_proofs
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;

-- Store members can insert proofs for their orders
CREATE POLICY "Store members insert delivery proofs"
  ON public.delivery_proofs FOR INSERT
  WITH CHECK (is_store_member(store_id, auth.uid()));

-- Store members can read proofs
CREATE POLICY "Store members read delivery proofs"
  ON public.delivery_proofs FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

-- Marketplace admins can read all proofs
CREATE POLICY "Marketplace admins read delivery proofs"
  ON public.delivery_proofs FOR SELECT
  USING (has_role(auth.uid(), 'marketplace_admin'));

-- Buyers can read proofs for their orders (via customers table)
CREATE POLICY "Buyers read own delivery proofs"
  ON public.delivery_proofs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE o.id = delivery_proofs.order_id
        AND c.user_id = auth.uid()
    )
  );

-- RLS on delivery_proof_files
ALTER TABLE public.delivery_proof_files ENABLE ROW LEVEL SECURITY;

-- Store members can insert files for their proofs
CREATE POLICY "Store members insert proof files"
  ON public.delivery_proof_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_proofs dp
      WHERE dp.id = delivery_proof_files.proof_id
        AND is_store_member(dp.store_id, auth.uid())
    )
  );

-- Store members can read proof files
CREATE POLICY "Store members read proof files"
  ON public.delivery_proof_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery_proofs dp
      WHERE dp.id = delivery_proof_files.proof_id
        AND is_store_member(dp.store_id, auth.uid())
    )
  );

-- Marketplace admins can read all proof files
CREATE POLICY "Marketplace admins read proof files"
  ON public.delivery_proof_files FOR SELECT
  USING (has_role(auth.uid(), 'marketplace_admin'));

-- Buyers can read proof files for their orders
CREATE POLICY "Buyers read own proof files"
  ON public.delivery_proof_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery_proofs dp
      JOIN orders o ON o.id = dp.order_id
      JOIN customers c ON c.id = o.customer_id
      WHERE dp.id = delivery_proof_files.proof_id
        AND c.user_id = auth.uid()
    )
  );

-- Storage bucket for delivery proofs (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-proofs', 'delivery-proofs', false);

-- Storage policies: store members can upload
CREATE POLICY "Store members upload delivery proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'delivery-proofs' AND auth.role() = 'authenticated');

-- Store members can read their uploaded proofs
CREATE POLICY "Authenticated read delivery proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'delivery-proofs' AND auth.role() = 'authenticated');
