
-- 1. Drop dangerous anonymous UPDATE policies on tracking tables
DROP POLICY IF EXISTS "Anon update tracking events" ON public.tracking_events;
DROP POLICY IF EXISTS "Anon update tracking sessions" ON public.tracking_sessions;
DROP POLICY IF EXISTS "Public increment click count" ON public.tracking_links;

-- 2. Tighten tracking_events INSERT: validate store is active
DROP POLICY IF EXISTS "Anon insert tracking events" ON public.tracking_events;
CREATE POLICY "Validated insert tracking events"
  ON public.tracking_events FOR INSERT
  WITH CHECK (
    store_id IS NOT NULL 
    AND event_type IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM stores WHERE id = store_id AND is_active = true AND is_banned = false
    )
  );

-- 3. Tighten tracking_sessions INSERT: validate store is active
DROP POLICY IF EXISTS "Anon insert tracking sessions" ON public.tracking_sessions;
CREATE POLICY "Validated insert tracking sessions"
  ON public.tracking_sessions FOR INSERT
  WITH CHECK (
    store_id IS NOT NULL 
    AND session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM stores WHERE id = store_id AND is_active = true AND is_banned = false
    )
  );

-- 4. Tighten analytics_events INSERT: validate store is active
DROP POLICY IF EXISTS "Anon insert analytics events" ON public.analytics_events;
CREATE POLICY "Validated insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (
    store_id IS NOT NULL 
    AND event_type IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM stores WHERE id = store_id AND is_active = true AND is_banned = false
    )
  );

-- 5. Tighten order_attributions INSERT: validate order belongs to store
DROP POLICY IF EXISTS "Anon insert order attributions" ON public.order_attributions;
CREATE POLICY "Validated insert order attributions"
  ON public.order_attributions FOR INSERT
  WITH CHECK (
    store_id IS NOT NULL 
    AND order_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM orders WHERE id = order_id AND store_id = order_attributions.store_id
    )
  );

-- 6. Revoke public execution of release_escrow to prevent direct RPC calls
REVOKE EXECUTE ON FUNCTION public.release_escrow FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_escrow FROM anon;
REVOKE EXECUTE ON FUNCTION public.release_escrow FROM authenticated;
