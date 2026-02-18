
-- Drop the restrictive INSERT policies on orders
DROP POLICY IF EXISTS "Anon place order with store" ON public.orders;
DROP POLICY IF EXISTS "Auth place order with store" ON public.orders;

-- Recreate as PERMISSIVE
CREATE POLICY "Anon place order with store"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (store_id IS NOT NULL AND order_number IS NOT NULL);

CREATE POLICY "Auth place order with store"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (store_id IS NOT NULL AND order_number IS NOT NULL);

-- Same fix for order_items
DROP POLICY IF EXISTS "Anon insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Auth insert order items" ON public.order_items;

CREATE POLICY "Anon insert order items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (order_id IS NOT NULL AND product_name IS NOT NULL);

CREATE POLICY "Auth insert order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (order_id IS NOT NULL AND product_name IS NOT NULL);
