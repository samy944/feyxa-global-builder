
-- Product ranking scores table
CREATE TABLE public.product_ranking_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  sales_30d integer NOT NULL DEFAULT 0,
  sales_weight numeric NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  seller_sla numeric NOT NULL DEFAULT 100,
  return_rate numeric NOT NULL DEFAULT 0,
  risk_penalty numeric NOT NULL DEFAULT 0,
  previous_score numeric NOT NULL DEFAULT 0,
  trending_badge boolean NOT NULL DEFAULT false,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ranking_score ON public.product_ranking_scores(score DESC);
CREATE INDEX idx_ranking_product ON public.product_ranking_scores(product_id);
CREATE INDEX idx_ranking_trending ON public.product_ranking_scores(trending_badge) WHERE trending_badge = true;

-- Enable RLS
ALTER TABLE public.product_ranking_scores ENABLE ROW LEVEL SECURITY;

-- Public read (marketplace needs this)
CREATE POLICY "Public read ranking scores"
  ON public.product_ranking_scores FOR SELECT
  USING (true);

-- Only service role writes (via edge function)
-- No insert/update/delete policies for regular users

-- Admin full access
CREATE POLICY "Admins manage ranking scores"
  ON public.product_ranking_scores FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- Enable realtime for admin monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_ranking_scores;
