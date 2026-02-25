
-- Fix security definer view: replace with a security invoker function
DROP VIEW IF EXISTS public.system_health_metrics;

CREATE OR REPLACE FUNCTION public.get_system_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only allow marketplace admins
  IF NOT has_role(auth.uid(), 'marketplace_admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT jsonb_build_object(
    'gmv_current_month', (SELECT COALESCE(SUM(total), 0) FROM orders WHERE created_at >= date_trunc('month', now())),
    'gmv_previous_month', (SELECT COALESCE(SUM(total), 0) FROM orders WHERE created_at >= date_trunc('month', now() - interval '1 month') AND created_at < date_trunc('month', now())),
    'active_orders', (SELECT COUNT(*) FROM orders WHERE status NOT IN ('delivered', 'cancelled')),
    'failed_events_24h', (SELECT COUNT(*) FROM events_log WHERE status IN ('failed', 'max_retries_exceeded') AND created_at >= now() - interval '24 hours'),
    'total_events_24h', (SELECT COUNT(*) FROM events_log WHERE created_at >= now() - interval '24 hours'),
    'escrow_held_count', (SELECT COUNT(*) FROM escrow_records WHERE status = 'held'),
    'escrow_held_amount', (SELECT COALESCE(SUM(amount), 0) FROM escrow_records WHERE status = 'held'),
    'escrow_total_count', (SELECT COUNT(*) FROM escrow_records),
    'payouts_pending', (SELECT COUNT(*) FROM payout_requests WHERE status = 'pending'),
    'payouts_pending_amount', (SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status = 'pending'),
    'outbound_delivered', (SELECT COUNT(*) FROM outbound_shipments WHERE status = 'delivered'),
    'outbound_on_time', (SELECT COUNT(*) FROM outbound_shipments WHERE status = 'delivered' AND updated_at <= sla_deadline),
    'outbound_total', (SELECT COUNT(*) FROM outbound_shipments),
    'orders_delivered', (SELECT COUNT(*) FROM orders WHERE status = 'delivered'),
    'orders_total', (SELECT COUNT(*) FROM orders),
    'dead_letter_count', (SELECT COUNT(*) FROM events_log WHERE status = 'max_retries_exceeded'),
    'active_stores', (SELECT COUNT(*) FROM stores WHERE is_active = true),
    'total_users', (SELECT COUNT(DISTINCT user_id) FROM user_roles),
    'avg_event_latency_ms', (SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (processed_at - created_at)) * 1000)::numeric, 0), 0)
     FROM events_log WHERE processed_at IS NOT NULL AND created_at >= now() - interval '24 hours')
  ) INTO result;
  
  RETURN result;
END;
$$;
