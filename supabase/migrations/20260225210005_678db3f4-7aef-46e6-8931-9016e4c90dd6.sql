
-- ════════════════════════════════════════
-- FEYXA CAPITAL – Seller Financing Engine
-- ════════════════════════════════════════

-- 1) Seller financing eligibility scores
CREATE TABLE public.seller_financing_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  sales_90d numeric NOT NULL DEFAULT 0,
  return_rate numeric NOT NULL DEFAULT 0,
  risk_score numeric NOT NULL DEFAULT 50,
  reputation_score numeric NOT NULL DEFAULT 50,
  eligibility_score numeric NOT NULL DEFAULT 0,
  max_eligible_amount numeric NOT NULL DEFAULT 0,
  is_eligible boolean NOT NULL DEFAULT false,
  frozen boolean NOT NULL DEFAULT false,
  frozen_reason text,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.seller_financing_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view their financing score"
  ON public.seller_financing_scores FOR SELECT
  TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "Service role manages financing scores"
  ON public.seller_financing_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2) Financing offers
CREATE TYPE public.financing_offer_status AS ENUM (
  'offered', 'accepted', 'active', 'closed', 'defaulted'
);

CREATE TABLE public.financing_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  offered_amount numeric NOT NULL,
  repayment_percentage numeric NOT NULL DEFAULT 15,
  total_repayable numeric NOT NULL,
  remaining_balance numeric NOT NULL,
  amount_repaid numeric NOT NULL DEFAULT 0,
  status public.financing_offer_status NOT NULL DEFAULT 'offered',
  accepted_at timestamptz,
  closed_at timestamptz,
  defaulted_at timestamptz,
  missed_cycles integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financing_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view their financing offers"
  ON public.financing_offers FOR SELECT
  TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "Store admins can accept offers"
  ON public.financing_offers FOR UPDATE
  TO authenticated
  USING (public.is_store_admin_or_owner(store_id, auth.uid()))
  WITH CHECK (public.is_store_admin_or_owner(store_id, auth.uid()));

CREATE POLICY "Service role manages financing offers"
  ON public.financing_offers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3) Financing repayments log
CREATE TABLE public.financing_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.financing_offers(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  payout_id uuid REFERENCES public.payout_requests(id),
  amount_deducted numeric NOT NULL,
  payout_amount numeric NOT NULL,
  remaining_after numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financing_repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view their repayments"
  ON public.financing_repayments FOR SELECT
  TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "Service role manages repayments"
  ON public.financing_repayments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4) Accept financing offer RPC
CREATE OR REPLACE FUNCTION public.accept_financing_offer(_offer_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _offer financing_offers%ROWTYPE;
  _wallet_id uuid;
BEGIN
  SELECT * INTO _offer FROM financing_offers WHERE id = _offer_id FOR UPDATE;
  
  IF _offer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offre introuvable');
  END IF;
  
  IF _offer.status <> 'offered' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offre non disponible');
  END IF;
  
  -- Check user is admin/owner
  IF NOT is_store_admin_or_owner(_offer.store_id, _user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée');
  END IF;
  
  -- Check no other active financing
  IF EXISTS (SELECT 1 FROM financing_offers WHERE store_id = _offer.store_id AND status IN ('accepted', 'active')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Un financement est déjà actif');
  END IF;
  
  -- Accept and credit wallet
  UPDATE financing_offers
  SET status = 'active', accepted_at = now(), updated_at = now()
  WHERE id = _offer_id;
  
  _wallet_id := ensure_wallet(_offer.store_id);
  
  UPDATE wallets SET balance_available = balance_available + _offer.offered_amount
  WHERE id = _wallet_id;
  
  INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id)
  VALUES (_wallet_id, 'financing_credit', _offer.offered_amount, 'Feyxa Capital - Financement reçu', _offer_id);
  
  -- Audit
  INSERT INTO audit_logs (store_id, user_id, action, target_type, target_id, metadata)
  VALUES (_offer.store_id, _user_id, 'financing_accepted', 'financing_offer', _offer_id::text,
    jsonb_build_object('amount', _offer.offered_amount, 'repayment_pct', _offer.repayment_percentage));
  
  RETURN jsonb_build_object('success', true, 'amount', _offer.offered_amount);
END;
$$;

-- 5) Process financing repayment on payout RPC
CREATE OR REPLACE FUNCTION public.process_financing_repayment(_store_id uuid, _payout_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _offer financing_offers%ROWTYPE;
  _deduction numeric;
  _remaining numeric;
BEGIN
  -- Find active financing
  SELECT * INTO _offer FROM financing_offers
  WHERE store_id = _store_id AND status = 'active'
  ORDER BY created_at ASC LIMIT 1
  FOR UPDATE;
  
  IF _offer.id IS NULL THEN
    RETURN jsonb_build_object('has_deduction', false, 'deduction', 0, 'net_payout', _payout_amount);
  END IF;
  
  -- Calculate deduction
  _deduction := ROUND(_payout_amount * (_offer.repayment_percentage / 100.0), 2);
  _deduction := LEAST(_deduction, _offer.remaining_balance);
  _remaining := _offer.remaining_balance - _deduction;
  
  -- Update offer
  UPDATE financing_offers
  SET remaining_balance = _remaining,
      amount_repaid = amount_repaid + _deduction,
      updated_at = now(),
      status = CASE WHEN _remaining <= 0 THEN 'closed'::financing_offer_status ELSE status END,
      closed_at = CASE WHEN _remaining <= 0 THEN now() ELSE closed_at END
  WHERE id = _offer.id;
  
  -- Log repayment
  INSERT INTO financing_repayments (offer_id, store_id, amount_deducted, payout_amount, remaining_after)
  VALUES (_offer.id, _store_id, _deduction, _payout_amount, GREATEST(_remaining, 0));
  
  RETURN jsonb_build_object(
    'has_deduction', true,
    'deduction', _deduction,
    'net_payout', _payout_amount - _deduction,
    'remaining_balance', GREATEST(_remaining, 0),
    'offer_closed', _remaining <= 0
  );
END;
$$;

-- Index for performance
CREATE INDEX idx_financing_offers_store_status ON public.financing_offers(store_id, status);
CREATE INDEX idx_financing_repayments_offer ON public.financing_repayments(offer_id);
CREATE INDEX idx_financing_scores_store ON public.seller_financing_scores(store_id);
