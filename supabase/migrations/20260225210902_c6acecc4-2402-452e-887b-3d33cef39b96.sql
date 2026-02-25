
-- ══════════════════════════════════════════════════
-- FEYXA FULFILLMENT NETWORK (FBA-like system)
-- ══════════════════════════════════════════════════

-- ── Enums ──
CREATE TYPE public.shipment_status AS ENUM ('draft', 'in_transit', 'received', 'cancelled');
CREATE TYPE public.outbound_status AS ENUM ('pending', 'picking', 'packed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.fulfillment_type AS ENUM ('seller', 'feyxa');

-- ── 1. Warehouses ──
CREATE TABLE public.warehouses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  country_id uuid REFERENCES public.countries(id),
  city text NOT NULL,
  address text,
  capacity integer NOT NULL DEFAULT 10000,
  current_occupancy integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Warehouses readable by everyone"
  ON public.warehouses FOR SELECT USING (true);

CREATE POLICY "Warehouses managed by admins"
  ON public.warehouses FOR ALL
  USING (public.has_role(auth.uid(), 'marketplace_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin'));

-- ── 2. Warehouse Inventory ──
CREATE TABLE public.warehouse_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  reserved_quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, product_id)
);

ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Warehouse inventory readable by store members"
  ON public.warehouse_inventory FOR SELECT
  USING (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "Warehouse inventory managed by admins"
  ON public.warehouse_inventory FOR ALL
  USING (public.has_role(auth.uid(), 'marketplace_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin'));

-- ── 3. Inbound Shipments (seller → warehouse) ──
CREATE TABLE public.inbound_shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  status public.shipment_status NOT NULL DEFAULT 'draft',
  tracking_number text,
  notes text,
  shipped_at timestamptz,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inbound_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inbound shipments readable by store members"
  ON public.inbound_shipments FOR SELECT
  USING (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "Inbound shipments writable by store admins"
  ON public.inbound_shipments FOR INSERT
  WITH CHECK (public.is_store_admin_or_owner(store_id, auth.uid()));

CREATE POLICY "Inbound shipments updatable by store admins or platform admins"
  ON public.inbound_shipments FOR UPDATE
  USING (
    public.is_store_admin_or_owner(store_id, auth.uid())
    OR public.has_role(auth.uid(), 'marketplace_admin')
  );

CREATE POLICY "Inbound shipments managed by platform admins"
  ON public.inbound_shipments FOR ALL
  USING (public.has_role(auth.uid(), 'marketplace_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin'));

-- ── 4. Inbound Items ──
CREATE TABLE public.inbound_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES public.inbound_shipments(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  received_quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inbound_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inbound items readable via shipment"
  ON public.inbound_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.inbound_shipments s
    WHERE s.id = shipment_id
    AND (public.is_store_member(s.store_id, auth.uid()) OR public.has_role(auth.uid(), 'marketplace_admin'))
  ));

CREATE POLICY "Inbound items writable via shipment"
  ON public.inbound_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.inbound_shipments s
    WHERE s.id = shipment_id
    AND (public.is_store_admin_or_owner(s.store_id, auth.uid()) OR public.has_role(auth.uid(), 'marketplace_admin'))
  ));

CREATE POLICY "Inbound items managed by admins"
  ON public.inbound_items FOR ALL
  USING (public.has_role(auth.uid(), 'marketplace_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin'));

-- ── 5. Outbound Shipments (warehouse → customer) ──
CREATE TABLE public.outbound_shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  store_id uuid NOT NULL REFERENCES public.stores(id),
  status public.outbound_status NOT NULL DEFAULT 'pending',
  tracking_number text,
  picked_at timestamptz,
  packed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  sla_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.outbound_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Outbound readable by store members"
  ON public.outbound_shipments FOR SELECT
  USING (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "Outbound managed by admins"
  ON public.outbound_shipments FOR ALL
  USING (public.has_role(auth.uid(), 'marketplace_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin'));

-- ── 6. Add fulfillment_type to product_listings ──
ALTER TABLE public.product_listings
  ADD COLUMN IF NOT EXISTS fulfillment_type public.fulfillment_type NOT NULL DEFAULT 'seller';

-- ── Indexes ──
CREATE INDEX idx_warehouse_inventory_product ON public.warehouse_inventory(product_id);
CREATE INDEX idx_warehouse_inventory_store ON public.warehouse_inventory(store_id);
CREATE INDEX idx_warehouse_inventory_warehouse ON public.warehouse_inventory(warehouse_id);
CREATE INDEX idx_inbound_shipments_store ON public.inbound_shipments(store_id, status);
CREATE INDEX idx_inbound_items_shipment ON public.inbound_items(shipment_id);
CREATE INDEX idx_outbound_shipments_order ON public.outbound_shipments(order_id);
CREATE INDEX idx_outbound_shipments_warehouse ON public.outbound_shipments(warehouse_id, status);
CREATE INDEX idx_product_listings_fulfillment ON public.product_listings(fulfillment_type);

-- ── RPC: Receive inbound shipment (admin receives stock at warehouse) ──
CREATE OR REPLACE FUNCTION public.receive_inbound_shipment(_shipment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ship inbound_shipments%ROWTYPE;
  _item RECORD;
  _total_received integer := 0;
BEGIN
  SELECT * INTO _ship FROM inbound_shipments WHERE id = _shipment_id FOR UPDATE;
  
  IF _ship.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;
  
  IF _ship.status = 'received' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already received');
  END IF;
  
  -- Process each item
  FOR _item IN SELECT * FROM inbound_items WHERE shipment_id = _shipment_id LOOP
    -- Upsert warehouse inventory
    INSERT INTO warehouse_inventory (warehouse_id, product_id, store_id, quantity)
    VALUES (_ship.warehouse_id, _item.product_id, _ship.store_id, _item.quantity)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET quantity = warehouse_inventory.quantity + _item.quantity, updated_at = now();
    
    -- Update received quantity
    UPDATE inbound_items SET received_quantity = _item.quantity WHERE id = _item.id;
    
    _total_received := _total_received + _item.quantity;
  END LOOP;
  
  -- Update shipment status
  UPDATE inbound_shipments
  SET status = 'received', received_at = now(), updated_at = now()
  WHERE id = _shipment_id;
  
  -- Update warehouse occupancy
  UPDATE warehouses
  SET current_occupancy = current_occupancy + _total_received, updated_at = now()
  WHERE id = _ship.warehouse_id;
  
  -- Notify seller
  INSERT INTO notifications (store_id, type, title, body, metadata)
  VALUES (_ship.store_id, 'fulfillment', 'Envoi reçu à l''entrepôt',
    _total_received || ' unités reçues et disponibles.',
    jsonb_build_object('shipment_id', _shipment_id));
  
  RETURN jsonb_build_object('success', true, 'total_received', _total_received);
END;
$$;

-- ── RPC: Assign fulfillment for an order ──
CREATE OR REPLACE FUNCTION public.assign_fulfillment(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _order orders%ROWTYPE;
  _item RECORD;
  _warehouse_id uuid;
  _outbound_id uuid;
  _sla timestamptz;
BEGIN
  SELECT * INTO _order FROM orders WHERE id = _order_id;
  
  IF _order.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Check if already assigned
  IF EXISTS (SELECT 1 FROM outbound_shipments WHERE order_id = _order_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already assigned');
  END IF;
  
  -- Find best warehouse with stock for ALL items
  SELECT wi.warehouse_id INTO _warehouse_id
  FROM order_items oi
  JOIN warehouse_inventory wi ON wi.product_id = oi.product_id AND wi.store_id = _order.store_id
  WHERE oi.order_id = _order_id AND wi.quantity - wi.reserved_quantity >= oi.quantity
  GROUP BY wi.warehouse_id
  HAVING COUNT(*) = (SELECT COUNT(*) FROM order_items WHERE order_id = _order_id)
  LIMIT 1;
  
  IF _warehouse_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No warehouse with sufficient stock');
  END IF;
  
  -- SLA: 48h from now
  _sla := now() + interval '48 hours';
  
  -- Create outbound shipment
  INSERT INTO outbound_shipments (order_id, warehouse_id, store_id, status, sla_deadline)
  VALUES (_order_id, _warehouse_id, _order.store_id, 'pending', _sla)
  RETURNING id INTO _outbound_id;
  
  -- Reserve stock
  FOR _item IN SELECT * FROM order_items WHERE order_id = _order_id LOOP
    UPDATE warehouse_inventory
    SET reserved_quantity = reserved_quantity + _item.quantity, updated_at = now()
    WHERE warehouse_id = _warehouse_id AND product_id = _item.product_id;
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'outbound_id', _outbound_id, 'warehouse_id', _warehouse_id);
END;
$$;

-- ── Triggers ──
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_warehouse_inventory_updated_at
  BEFORE UPDATE ON public.warehouse_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_inbound_shipments_updated_at
  BEFORE UPDATE ON public.inbound_shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_outbound_shipments_updated_at
  BEFORE UPDATE ON public.outbound_shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
