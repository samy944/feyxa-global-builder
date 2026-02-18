
-- Atomic stock decrement: returns true if stock was sufficient
CREATE OR REPLACE FUNCTION public.decrement_stock(_product_id uuid, _quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock_quantity INTO current_stock
  FROM public.products
  WHERE id = _product_id
  FOR UPDATE;

  IF current_stock IS NULL OR current_stock < _quantity THEN
    RETURN false;
  END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity - _quantity,
      updated_at = now()
  WHERE id = _product_id;

  RETURN true;
END;
$$;

-- Upsert customer by phone+store, returns customer id
CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(
  _store_id uuid,
  _first_name text,
  _last_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _city text DEFAULT NULL,
  _quarter text DEFAULT NULL,
  _address text DEFAULT NULL
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
    -- Update existing customer info
    UPDATE public.customers
    SET first_name = _first_name,
        last_name = COALESCE(_last_name, last_name),
        city = COALESCE(_city, city),
        quarter = COALESCE(_quarter, quarter),
        address = COALESCE(_address, address),
        updated_at = now()
    WHERE id = _customer_id;
  ELSE
    -- Create new customer
    INSERT INTO public.customers (store_id, first_name, last_name, phone, city, quarter, address)
    VALUES (_store_id, _first_name, _last_name, _phone, _city, _quarter, _address)
    RETURNING id INTO _customer_id;
  END IF;

  RETURN _customer_id;
END;
$$;
