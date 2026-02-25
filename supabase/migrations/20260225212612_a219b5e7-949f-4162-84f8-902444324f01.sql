
-- ================================================
-- FEYXA SYSTEM HARDENING & CONSOLIDATION
-- ================================================

-- 1) CRITICAL PERFORMANCE INDEXES
-- ================================================

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON public.orders (store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);

-- Escrow
CREATE INDEX IF NOT EXISTS idx_escrow_status_release ON public.escrow_records (status, release_at) WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_escrow_store ON public.escrow_records (store_id, status);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_status_retry ON public.events_log (status, next_retry_at) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_events_created ON public.events_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_status ON public.events_log (event_type, status);

-- Handler logs
CREATE INDEX IF NOT EXISTS idx_handler_logs_event ON public.event_handlers_log (event_id, status);

-- Wallet transactions
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON public.wallet_transactions (type);

-- Payouts
CREATE INDEX IF NOT EXISTS idx_payouts_store_status ON public.payout_requests (store_id, status);

-- Listings
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.marketplace_listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_store ON public.marketplace_listings (store_id, status);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_store_published ON public.products (store_id, is_published);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);

-- Warehouse
CREATE INDEX IF NOT EXISTS idx_warehouse_inv_product ON public.warehouse_inventory (product_id);
CREATE INDEX IF NOT EXISTS idx_outbound_status ON public.outbound_shipments (status);
CREATE INDEX IF NOT EXISTS idx_outbound_sla ON public.outbound_shipments (sla_deadline) WHERE status NOT IN ('delivered', 'cancelled');

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items (product_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_store_read ON public.notifications (store_id, is_read, created_at DESC);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_store_type ON public.analytics_events (store_id, event_type, created_at DESC);

-- Returns
CREATE INDEX IF NOT EXISTS idx_returns_order ON public.return_requests (order_id);
CREATE INDEX IF NOT EXISTS idx_returns_store_status ON public.return_requests (store_id, status);

-- Audit
CREATE INDEX IF NOT EXISTS idx_audit_store_created ON public.audit_logs (store_id, created_at DESC);

-- 2) DOUBLE PAYOUT PREVENTION
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_unique_pending 
ON public.payout_requests (store_id) 
WHERE status = 'pending';

-- 3) SYSTEM HEALTH METRICS VIEW
CREATE OR REPLACE VIEW public.system_health_metrics AS
SELECT
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE created_at >= date_trunc('month', now())) AS gmv_current_month,
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE created_at >= date_trunc('month', now() - interval '1 month') AND created_at < date_trunc('month', now())) AS gmv_previous_month,
  (SELECT COUNT(*) FROM orders WHERE status NOT IN ('delivered', 'cancelled')) AS active_orders,
  (SELECT COUNT(*) FROM events_log WHERE status IN ('failed', 'max_retries_exceeded') AND created_at >= now() - interval '24 hours') AS failed_events_24h,
  (SELECT COUNT(*) FROM events_log WHERE created_at >= now() - interval '24 hours') AS total_events_24h,
  (SELECT COUNT(*) FROM escrow_records WHERE status = 'held') AS escrow_held_count,
  (SELECT COALESCE(SUM(amount), 0) FROM escrow_records WHERE status = 'held') AS escrow_held_amount,
  (SELECT COUNT(*) FROM escrow_records) AS escrow_total_count,
  (SELECT COUNT(*) FROM payout_requests WHERE status = 'pending') AS payouts_pending,
  (SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status = 'pending') AS payouts_pending_amount,
  (SELECT COUNT(*) FROM outbound_shipments WHERE status = 'delivered') AS outbound_delivered,
  (SELECT COUNT(*) FROM outbound_shipments WHERE status = 'delivered' AND updated_at <= sla_deadline) AS outbound_on_time,
  (SELECT COUNT(*) FROM outbound_shipments) AS outbound_total,
  (SELECT COUNT(*) FROM orders WHERE status = 'delivered') AS orders_delivered,
  (SELECT COUNT(*) FROM orders) AS orders_total,
  (SELECT COUNT(*) FROM events_log WHERE status = 'max_retries_exceeded') AS dead_letter_count,
  (SELECT COUNT(*) FROM stores WHERE is_active = true) AS active_stores,
  (SELECT COUNT(DISTINCT user_id) FROM user_roles) AS total_users,
  (SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (processed_at - created_at)) * 1000), 0)
   FROM events_log WHERE processed_at IS NOT NULL AND created_at >= now() - interval '24 hours') AS avg_event_latency_ms;

GRANT SELECT ON public.system_health_metrics TO authenticated;

-- 4) IMMUTABLE FINANCIAL LOGS
CREATE OR REPLACE FUNCTION public.prevent_financial_mutation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  RAISE EXCEPTION 'Financial records are immutable and cannot be modified or deleted';
END;
$$;

DROP TRIGGER IF EXISTS immutable_wallet_transactions ON public.wallet_transactions;
CREATE TRIGGER immutable_wallet_transactions
BEFORE UPDATE OR DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_mutation();

CREATE OR REPLACE FUNCTION public.restrict_escrow_mutation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Escrow records cannot be deleted';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.amount <> NEW.amount OR OLD.order_id <> NEW.order_id OR OLD.store_id <> NEW.store_id THEN
      RAISE EXCEPTION 'Cannot modify core escrow fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_escrow_changes ON public.escrow_records;
CREATE TRIGGER restrict_escrow_changes
BEFORE UPDATE OR DELETE ON public.escrow_records
FOR EACH ROW EXECUTE FUNCTION public.restrict_escrow_mutation();

DROP TRIGGER IF EXISTS immutable_financing_repayments ON public.financing_repayments;
CREATE TRIGGER immutable_financing_repayments
BEFORE UPDATE OR DELETE ON public.financing_repayments
FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_mutation();

-- 5) TIMEOUT STALE EVENTS
CREATE OR REPLACE FUNCTION public.timeout_stale_events()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE timed_out integer;
BEGIN
  WITH stale AS (
    UPDATE events_log
    SET status = 'failed', error_message = 'Processing timeout: stuck >10min'
    WHERE status = 'processing' AND created_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT COUNT(*) INTO timed_out FROM stale;
  RETURN timed_out;
END;
$$;
