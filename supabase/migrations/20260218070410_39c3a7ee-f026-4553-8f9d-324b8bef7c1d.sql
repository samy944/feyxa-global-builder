
-- Fix: products SELECT policies are all restrictive, causing AND logic
-- Members read + Public read = both must pass for authenticated users
-- Need to make them PERMISSIVE (OR logic)
DROP POLICY IF EXISTS "Members read products" ON public.products;
DROP POLICY IF EXISTS "Public read published products" ON public.products;

-- Recreate as PERMISSIVE
CREATE POLICY "Members read products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (is_store_member(store_id, auth.uid()));

CREATE POLICY "Public read published products"
  ON public.products
  FOR SELECT
  USING (is_published = true);
