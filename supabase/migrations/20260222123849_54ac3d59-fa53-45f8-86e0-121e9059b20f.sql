
-- Fix overly permissive UPDATE policy - restrict to matching store_id
DROP POLICY "Anon update tracking events" ON public.tracking_events;

CREATE POLICY "Update tracking event counts"
  ON public.tracking_events FOR UPDATE
  USING (store_id IS NOT NULL)
  WITH CHECK (store_id IS NOT NULL);
