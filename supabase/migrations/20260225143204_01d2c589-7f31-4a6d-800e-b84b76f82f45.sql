
-- Fix the overly permissive INSERT policy on email_logs
DROP POLICY IF EXISTS "Service can insert email logs" ON public.email_logs;

-- Only authenticated users (edge functions use service role anyway) can insert
CREATE POLICY "Authenticated insert email logs"
  ON public.email_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin'));
