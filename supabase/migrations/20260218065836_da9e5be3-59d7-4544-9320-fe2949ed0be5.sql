
-- Fix: the public read policy on stores must be PERMISSIVE so anonymous users can read active stores
-- Drop the restrictive one and recreate as permissive
DROP POLICY IF EXISTS "Public read active stores by slug" ON public.stores;

CREATE POLICY "Public read active stores"
  ON public.stores
  FOR SELECT
  USING (is_active = true AND is_banned = false);
