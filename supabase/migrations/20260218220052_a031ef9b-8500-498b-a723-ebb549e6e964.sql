
-- Allow marketplace admins to read all payout requests
CREATE POLICY "Marketplace admins read payouts"
ON public.payout_requests
FOR SELECT
USING (has_role(auth.uid(), 'marketplace_admin'));

-- Allow marketplace admins to update payout requests (approve/reject)
CREATE POLICY "Marketplace admins update payouts"
ON public.payout_requests
FOR UPDATE
USING (has_role(auth.uid(), 'marketplace_admin'));
