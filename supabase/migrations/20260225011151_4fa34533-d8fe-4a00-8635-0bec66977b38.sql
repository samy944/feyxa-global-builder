
-- Drop the overly permissive policy that allows anyone to read all escrow records
DROP POLICY IF EXISTS "Public read own escrow" ON public.escrow_records;

-- Add proper policy: buyers can read escrow for their own orders
CREATE POLICY "Buyers read own order escrow" 
  ON public.escrow_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE o.id = escrow_records.order_id
        AND c.user_id = auth.uid()
    )
  );
