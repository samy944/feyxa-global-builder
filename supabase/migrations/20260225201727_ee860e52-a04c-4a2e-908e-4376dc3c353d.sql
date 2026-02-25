
-- ══════════════════════════════════════════
-- RISK & REPUTATION ENGINE TABLES
-- ══════════════════════════════════════════

-- 1) User (buyer) risk scores
CREATE TABLE public.user_risk_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  score integer NOT NULL DEFAULT 100,
  cod_failure_rate numeric NOT NULL DEFAULT 0,
  return_rate numeric NOT NULL DEFAULT 0,
  dispute_rate numeric NOT NULL DEFAULT 0,
  payment_failure_rate numeric NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  cod_disabled boolean NOT NULL DEFAULT false,
  manual_review boolean NOT NULL DEFAULT false,
  admin_override_score integer,
  admin_override_reason text,
  admin_override_by uuid,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Seller risk scores
CREATE TABLE public.seller_risk_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 100,
  late_shipment_rate numeric NOT NULL DEFAULT 0,
  cancellation_rate numeric NOT NULL DEFAULT 0,
  return_rate numeric NOT NULL DEFAULT 0,
  dispute_rate numeric NOT NULL DEFAULT 0,
  sla_compliance numeric NOT NULL DEFAULT 100,
  total_orders integer NOT NULL DEFAULT 0,
  factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility_reduced boolean NOT NULL DEFAULT false,
  payouts_frozen boolean NOT NULL DEFAULT false,
  manual_review boolean NOT NULL DEFAULT false,
  admin_override_score integer,
  admin_override_reason text,
  admin_override_by uuid,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Seller reputation (public facing)
CREATE TABLE public.seller_reputation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  avg_rating numeric NOT NULL DEFAULT 0,
  response_time_hours numeric NOT NULL DEFAULT 0,
  delivery_speed_score numeric NOT NULL DEFAULT 0,
  product_quality_score numeric NOT NULL DEFAULT 0,
  reputation_score numeric NOT NULL DEFAULT 50,
  verified_badge boolean NOT NULL DEFAULT false,
  total_reviews integer NOT NULL DEFAULT 0,
  total_sales integer NOT NULL DEFAULT 0,
  ranking_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Risk score history for audit trail
CREATE TABLE public.risk_score_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type text NOT NULL, -- 'user' or 'seller'
  target_id uuid NOT NULL,
  previous_score integer,
  new_score integer NOT NULL,
  change_reason text NOT NULL DEFAULT 'auto_calculation',
  changed_by uuid, -- null = system, uuid = admin
  factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ══ INDEXES ══
CREATE INDEX idx_user_risk_scores_score ON public.user_risk_scores(score);
CREATE INDEX idx_seller_risk_scores_score ON public.seller_risk_scores(score);
CREATE INDEX idx_seller_reputation_ranking ON public.seller_reputation(ranking_score DESC);
CREATE INDEX idx_risk_score_history_target ON public.risk_score_history(target_type, target_id);
CREATE INDEX idx_risk_score_history_created ON public.risk_score_history(created_at DESC);

-- ══ UPDATED_AT TRIGGERS ══
CREATE TRIGGER update_user_risk_scores_updated_at
  BEFORE UPDATE ON public.user_risk_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_seller_risk_scores_updated_at
  BEFORE UPDATE ON public.seller_risk_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_seller_reputation_updated_at
  BEFORE UPDATE ON public.seller_reputation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ══ RLS ══
ALTER TABLE public.user_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_score_history ENABLE ROW LEVEL SECURITY;

-- user_risk_scores: users read own, admins read/write all
CREATE POLICY "Users read own risk score"
  ON public.user_risk_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage user risk scores"
  ON public.user_risk_scores FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- seller_risk_scores: store members read, admins manage
CREATE POLICY "Store members read own seller risk"
  ON public.seller_risk_scores FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

CREATE POLICY "Admins manage seller risk scores"
  ON public.seller_risk_scores FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- seller_reputation: public read, admins manage
CREATE POLICY "Public read seller reputation"
  ON public.seller_reputation FOR SELECT
  USING (true);

CREATE POLICY "Admins manage seller reputation"
  ON public.seller_reputation FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- risk_score_history: admins read, store members read own
CREATE POLICY "Admins read all risk history"
  ON public.risk_score_history FOR SELECT
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role));

CREATE POLICY "Users read own risk history"
  ON public.risk_score_history FOR SELECT
  USING (target_type = 'user' AND target_id = auth.uid());

CREATE POLICY "Store members read own seller risk history"
  ON public.risk_score_history FOR SELECT
  USING (target_type = 'seller' AND is_store_member(target_id, auth.uid()));

-- Realtime for admin monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_risk_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_risk_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_reputation;
