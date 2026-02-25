
-- 1. Update upsert_checkout_customer to accept and set user_id
CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(
  _store_id uuid,
  _first_name text,
  _last_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _city text DEFAULT NULL,
  _quarter text DEFAULT NULL,
  _address text DEFAULT NULL,
  _user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _customer_id uuid;
BEGIN
  -- Try to find existing customer by phone + store
  SELECT id INTO _customer_id
  FROM public.customers
  WHERE store_id = _store_id AND phone = _phone
  LIMIT 1;

  IF _customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET first_name = _first_name,
        last_name = COALESCE(_last_name, last_name),
        city = COALESCE(_city, city),
        quarter = COALESCE(_quarter, quarter),
        address = COALESCE(_address, address),
        user_id = COALESCE(_user_id, user_id),
        updated_at = now()
    WHERE id = _customer_id;
  ELSE
    INSERT INTO public.customers (store_id, first_name, last_name, phone, city, quarter, address, user_id)
    VALUES (_store_id, _first_name, _last_name, _phone, _city, _quarter, _address, _user_id)
    RETURNING id INTO _customer_id;
  END IF;

  RETURN _customer_id;
END;
$$;

-- 2. Allow buyers to read their own customer records
CREATE POLICY "Buyers read own customer records"
  ON public.customers FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Allow buyers to read their own orders via customer_id
CREATE POLICY "Buyers read own orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = orders.customer_id AND c.user_id = auth.uid()
    )
  );

-- 4. Allow buyers to read order items for their own orders
CREATE POLICY "Buyers read own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE o.id = order_items.order_id AND c.user_id = auth.uid()
    )
  );
