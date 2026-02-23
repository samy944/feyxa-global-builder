
-- Fix: Replace overly permissive UPDATE policy on tracking_links
-- with a security definer function for click increment only
DROP POLICY IF EXISTS "Public increment click count" ON public.tracking_links;

-- Create a secure function to increment clicks
CREATE OR REPLACE FUNCTION public.increment_tracking_link_click(_short_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tracking_links
  SET click_count = click_count + 1, updated_at = now()
  WHERE short_code = _short_code;
END;
$$;
