
-- ── Inventory metrics table ──
CREATE TABLE public.inventory_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  sales_7d integer NOT NULL DEFAULT 0,
  sales_30d integer NOT NULL DEFAULT 0,
  avg_daily_sales numeric NOT NULL DEFAULT 0,
  growth_rate numeric NOT NULL DEFAULT 0,
  forecast_next_30d numeric NOT NULL DEFAULT 0,
  days_until_stockout numeric NOT NULL DEFAULT 999,
  recommended_stock_level integer NOT NULL DEFAULT 0,
  stock_status text NOT NULL DEFAULT 'healthy',
  high_demand boolean NOT NULL DEFAULT false,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, country_id)
);

CREATE INDEX idx_inventory_product ON public.inventory_metrics(product_id);
CREATE INDEX idx_inventory_stockout ON public.inventory_metrics(days_until_stockout) WHERE days_until_stockout < 14;
CREATE INDEX idx_inventory_status ON public.inventory_metrics(stock_status);

-- ── Stock locks for checkout protection ──
CREATE TABLE public.stock_locks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  session_id text NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  released boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_stock_locks_product ON public.stock_locks(product_id) WHERE released = false;
CREATE INDEX idx_stock_locks_expires ON public.stock_locks(expires_at) WHERE released = false;

-- ── RLS ──
ALTER TABLE public.inventory_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_locks ENABLE ROW LEVEL SECURITY;

-- Inventory metrics: store members read, admins full
CREATE POLICY "Store members read inventory metrics"
  ON public.inventory_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = inventory_metrics.product_id
      AND is_store_member(p.store_id, auth.uid())
    )
  );

CREATE POLICY "Admins manage inventory metrics"
  ON public.inventory_metrics FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- Stock locks: public insert (checkout), service manages
CREATE POLICY "Anyone can create stock locks"
  ON public.stock_locks FOR INSERT
  WITH CHECK (product_id IS NOT NULL AND quantity > 0);

CREATE POLICY "Anyone can read own session locks"
  ON public.stock_locks FOR SELECT
  USING (true);

CREATE POLICY "Admins manage stock locks"
  ON public.stock_locks FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- ── Function to release expired locks ──
CREATE OR REPLACE FUNCTION public.release_expired_stock_locks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released_count integer;
BEGIN
  WITH expired AS (
    UPDATE stock_locks
    SET released = true
    WHERE released = false AND expires_at < now()
    RETURNING product_id, variant_id, quantity
  )
  SELECT COUNT(*) INTO released_count FROM expired;
  
  -- Restore stock for expired locks
  UPDATE products p
  SET stock_quantity = p.stock_quantity + e.total_qty
  FROM (
    SELECT product_id, SUM(quantity) as total_qty
    FROM stock_locks
    WHERE released = true AND expires_at < now() AND expires_at > now() - interval '1 minute'
    GROUP BY product_id
  ) e
  WHERE p.id = e.product_id;
  
  RETURN released_count;
END;
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_metrics;
