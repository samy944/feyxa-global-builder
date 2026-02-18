
-- ══════════════════════════════════════════
-- ESCROW SYSTEM V1 - Tables & Functions
-- ══════════════════════════════════════════

-- 1. Enums
CREATE TYPE public.escrow_status AS ENUM ('held', 'released', 'refunded', 'disputed');
CREATE TYPE public.wallet_tx_type AS ENUM ('escrow_hold', 'escrow_release', 'commission', 'payout', 'refund');
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- 2. Wallets table (one per store)
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  balance_available numeric NOT NULL DEFAULT 0,
  balance_pending numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read wallet" ON public.wallets
  FOR SELECT USING (is_store_member(store_id, auth.uid()));

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Wallet transactions
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type public.wallet_tx_type NOT NULL,
  amount numeric NOT NULL,
  description text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = wallet_transactions.wallet_id
        AND is_store_member(w.store_id, auth.uid())
    )
  );

-- 4. Escrow records
CREATE TABLE public.escrow_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 0.05,
  commission_amount numeric NOT NULL DEFAULT 0,
  status public.escrow_status NOT NULL DEFAULT 'held',
  release_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.escrow_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read escrow" ON public.escrow_records
  FOR SELECT USING (is_store_member(store_id, auth.uid()));

-- Buyers can read escrow for their orders (via order_number lookup - we'll use a function)
CREATE POLICY "Public read own escrow" ON public.escrow_records
  FOR SELECT USING (true);

-- 5. Payout requests
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_details jsonb DEFAULT '{}'::jsonb,
  notes text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/owner manage payouts" ON public.payout_requests
  FOR ALL USING (is_store_admin_or_owner(store_id, auth.uid()));

CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. Function: ensure wallet exists for a store
CREATE OR REPLACE FUNCTION public.ensure_wallet(_store_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wallet_id uuid;
  _currency text;
BEGIN
  SELECT id INTO _wallet_id FROM wallets WHERE store_id = _store_id;
  IF _wallet_id IS NULL THEN
    SELECT currency INTO _currency FROM stores WHERE id = _store_id;
    INSERT INTO wallets (store_id, currency)
    VALUES (_store_id, COALESCE(_currency, 'XOF'))
    RETURNING id INTO _wallet_id;
  END IF;
  RETURN _wallet_id;
END;
$$;

-- 7. Function: create escrow when order is paid
CREATE OR REPLACE FUNCTION public.create_escrow_for_order(
  _order_id uuid,
  _commission_rate numeric DEFAULT 0.05
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _store_id uuid;
  _total numeric;
  _commission numeric;
  _net numeric;
  _wallet_id uuid;
  _escrow_id uuid;
BEGIN
  -- Get order info
  SELECT store_id, total INTO _store_id, _total
  FROM orders WHERE id = _order_id;

  IF _store_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Check no existing escrow
  IF EXISTS (SELECT 1 FROM escrow_records WHERE order_id = _order_id) THEN
    SELECT id INTO _escrow_id FROM escrow_records WHERE order_id = _order_id;
    RETURN _escrow_id;
  END IF;

  _commission := ROUND(_total * _commission_rate, 2);
  _net := _total - _commission;

  -- Ensure wallet
  _wallet_id := ensure_wallet(_store_id);

  -- Create escrow
  INSERT INTO escrow_records (order_id, store_id, amount, commission_rate, commission_amount)
  VALUES (_order_id, _store_id, _net, _commission_rate, _commission)
  RETURNING id INTO _escrow_id;

  -- Add to pending balance
  UPDATE wallets SET balance_pending = balance_pending + _net WHERE id = _wallet_id;

  -- Log transaction
  INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id)
  VALUES (_wallet_id, 'escrow_hold', _net, 'Escrow: commande en attente', _escrow_id);

  RETURN _escrow_id;
END;
$$;

-- 8. Function: release escrow
CREATE OR REPLACE FUNCTION public.release_escrow(_escrow_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec escrow_records%ROWTYPE;
  _wallet_id uuid;
BEGIN
  SELECT * INTO _rec FROM escrow_records WHERE id = _escrow_id FOR UPDATE;

  IF _rec.id IS NULL OR _rec.status <> 'held' THEN
    RETURN false;
  END IF;

  _wallet_id := ensure_wallet(_rec.store_id);

  -- Move pending → available
  UPDATE wallets
  SET balance_pending = balance_pending - _rec.amount,
      balance_available = balance_available + _rec.amount
  WHERE id = _wallet_id;

  -- Mark released
  UPDATE escrow_records
  SET status = 'released', released_at = now()
  WHERE id = _escrow_id;

  -- Log release
  INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id)
  VALUES (_wallet_id, 'escrow_release', _rec.amount, 'Fonds libérés', _escrow_id);

  -- Log commission
  INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id)
  VALUES (_wallet_id, 'commission', -_rec.commission_amount, 'Commission Feyxa', _escrow_id);

  RETURN true;
END;
$$;

-- 9. Function: request payout
CREATE OR REPLACE FUNCTION public.request_payout(
  _store_id uuid,
  _amount numeric,
  _payment_method text DEFAULT 'mobile_money',
  _payment_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wallet_id uuid;
  _available numeric;
  _payout_id uuid;
BEGIN
  _wallet_id := ensure_wallet(_store_id);

  SELECT balance_available INTO _available FROM wallets WHERE id = _wallet_id;

  IF _available < _amount OR _amount <= 0 THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  -- Deduct from available
  UPDATE wallets SET balance_available = balance_available - _amount WHERE id = _wallet_id;

  -- Create payout request
  INSERT INTO payout_requests (store_id, amount, payment_method, payment_details)
  VALUES (_store_id, _amount, _payment_method, _payment_details)
  RETURNING id INTO _payout_id;

  -- Log transaction
  INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id)
  VALUES (_wallet_id, 'payout', -_amount, 'Demande de retrait', _payout_id);

  RETURN _payout_id;
END;
$$;
