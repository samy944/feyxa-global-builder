
-- Both SELECT policies on stores are restrictive, meaning ALL must pass.
-- We need them to be PERMISSIVE (OR logic) so either members OR public can read.
DROP POLICY IF EXISTS "Members can read store" ON public.stores;
DROP POLICY IF EXISTS "Public read active stores" ON public.stores;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Members can read store"
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (is_store_member(id, auth.uid()));

CREATE POLICY "Public read active stores"
  ON public.stores
  FOR SELECT
  USING (is_active = true AND is_banned = false);
