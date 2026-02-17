
-- Tighten order insert policies to require store_id
DROP POLICY "Anyone can place order" ON public.orders;
DROP POLICY "Auth place order" ON public.orders;
CREATE POLICY "Anon place order with store" ON public.orders FOR INSERT TO anon
  WITH CHECK (store_id IS NOT NULL AND order_number IS NOT NULL);
CREATE POLICY "Auth place order with store" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (store_id IS NOT NULL AND order_number IS NOT NULL);

-- Tighten order items insert
DROP POLICY "Anyone insert order items" ON public.order_items;
DROP POLICY "Auth insert order items" ON public.order_items;
CREATE POLICY "Anon insert order items" ON public.order_items FOR INSERT TO anon
  WITH CHECK (order_id IS NOT NULL AND product_name IS NOT NULL);
CREATE POLICY "Auth insert order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (order_id IS NOT NULL AND product_name IS NOT NULL);
