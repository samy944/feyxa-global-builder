-- Allow public to read active stores by slug (for storefront)
CREATE POLICY "Public read active stores by slug"
ON public.stores FOR SELECT
USING (is_active = true);
