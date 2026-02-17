
-- FEYXA Multi-tenant E-commerce Schema

-- Enums
CREATE TYPE public.store_role AS ENUM ('owner', 'admin', 'staff');
CREATE TYPE public.order_status AS ENUM ('new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'cod', 'failed', 'refunded');
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stores table
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'XOF',
  locale TEXT NOT NULL DEFAULT 'fr',
  theme JSONB DEFAULT '{"primary": "#3b82f6", "style": "modern"}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  plan TEXT NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Store members
CREATE TABLE public.store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role store_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(12,2),
  cost_price NUMERIC(12,2),
  sku TEXT,
  barcode TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_published BOOLEAN NOT NULL DEFAULT false,
  images JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  weight_grams INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Product variants
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  options JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collections
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_smart BOOLEAN DEFAULT false,
  rules JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Collection products junction
CREATE TABLE public.collection_products (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

-- Store customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  quarter TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  order_number TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'new',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT DEFAULT 'cod',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_quarter TEXT,
  shipping_phone TEXT,
  notes TEXT,
  coupon_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, order_number)
);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(12,2),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

-- Delivery zones
CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cities TEXT[] DEFAULT '{}',
  quarters TEXT[] DEFAULT '{}',
  fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ ENABLE RLS ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER HELPER FUNCTIONS ============

-- Check if user is a member of a store
CREATE OR REPLACE FUNCTION public.is_store_member(_store_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE store_id = _store_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = _user_id
  );
$$;

-- Get store role for user
CREATE OR REPLACE FUNCTION public.get_store_role(_store_id UUID, _user_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = _user_id) THEN 'owner'
    ELSE (SELECT role::text FROM public.store_members WHERE store_id = _store_id AND user_id = _user_id LIMIT 1)
  END;
$$;

-- Check if user is owner or admin
CREATE OR REPLACE FUNCTION public.is_store_admin_or_owner(_store_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.get_store_role(_store_id, _user_id) IN ('owner', 'admin');
$$;

-- Get store_id from product
CREATE OR REPLACE FUNCTION public.get_store_id_for_product(_product_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT store_id FROM public.products WHERE id = _product_id;
$$;

-- Get store_id from order
CREATE OR REPLACE FUNCTION public.get_store_id_for_order(_order_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT store_id FROM public.orders WHERE id = _order_id;
$$;

-- ============ RLS POLICIES ============

-- Profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Stores: members can read, owner can update
CREATE POLICY "Members can read store" ON public.stores FOR SELECT TO authenticated
  USING (public.is_store_member(id, auth.uid()));
CREATE POLICY "Auth users can create store" ON public.stores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update store" ON public.stores FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

-- Store members
CREATE POLICY "Members can read members" ON public.store_members FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "Admin/owner can add members" ON public.store_members FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin_or_owner(store_id, auth.uid()) AND user_id <> auth.uid());
CREATE POLICY "Admin/owner can remove members" ON public.store_members FOR DELETE TO authenticated
  USING (public.is_store_admin_or_owner(store_id, auth.uid()) AND role <> 'owner');

-- Products: members read, admin/owner write. Public read for published products.
CREATE POLICY "Members read products" ON public.products FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "Public read published products" ON public.products FOR SELECT TO anon
  USING (is_published = true);
CREATE POLICY "Admin/owner manage products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin_or_owner(store_id, auth.uid()));
CREATE POLICY "Admin/owner update products" ON public.products FOR UPDATE TO authenticated
  USING (public.is_store_admin_or_owner(store_id, auth.uid()));
CREATE POLICY "Admin/owner delete products" ON public.products FOR DELETE TO authenticated
  USING (public.is_store_admin_or_owner(store_id, auth.uid()));

-- Product variants
CREATE POLICY "Read variants via product" ON public.product_variants FOR SELECT TO authenticated
  USING (public.is_store_member(public.get_store_id_for_product(product_id), auth.uid()));
CREATE POLICY "Public read variants" ON public.product_variants FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND is_published = true));
CREATE POLICY "Manage variants" ON public.product_variants FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin_or_owner(public.get_store_id_for_product(product_id), auth.uid()));
CREATE POLICY "Update variants" ON public.product_variants FOR UPDATE TO authenticated
  USING (public.is_store_admin_or_owner(public.get_store_id_for_product(product_id), auth.uid()));
CREATE POLICY "Delete variants" ON public.product_variants FOR DELETE TO authenticated
  USING (public.is_store_admin_or_owner(public.get_store_id_for_product(product_id), auth.uid()));

-- Collections
CREATE POLICY "Members read collections" ON public.collections FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "Public read collections" ON public.collections FOR SELECT TO anon
  USING (true);
CREATE POLICY "Admin/owner manage collections" ON public.collections FOR ALL TO authenticated
  USING (public.is_store_admin_or_owner(store_id, auth.uid()));

-- Collection products
CREATE POLICY "Read collection products" ON public.collection_products FOR SELECT TO anon USING (true);
CREATE POLICY "Manage collection products" ON public.collection_products FOR ALL TO authenticated
  USING (public.is_store_admin_or_owner(
    (SELECT store_id FROM public.collections WHERE id = collection_id), auth.uid()
  ));

-- Customers
CREATE POLICY "Members read customers" ON public.customers FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "Admin/owner manage customers" ON public.customers FOR ALL TO authenticated
  USING (public.is_store_admin_or_owner(store_id, auth.uid()));

-- Orders: members read, anyone can create (checkout)
CREATE POLICY "Members read orders" ON public.orders FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "Anyone can place order" ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth place order" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin/owner update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_store_admin_or_owner(store_id, auth.uid()));

-- Order items
CREATE POLICY "Read order items" ON public.order_items FOR SELECT TO authenticated
  USING (public.is_store_member(public.get_store_id_for_order(order_id), auth.uid()));
CREATE POLICY "Anyone insert order items" ON public.order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

-- Coupons
CREATE POLICY "Members read coupons" ON public.coupons FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "Admin/owner manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.is_store_admin_or_owner(store_id, auth.uid()));

-- Delivery zones
CREATE POLICY "Members read zones" ON public.delivery_zones FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "Public read zones" ON public.delivery_zones FOR SELECT TO anon USING (true);
CREATE POLICY "Admin/owner manage zones" ON public.delivery_zones FOR ALL TO authenticated
  USING (public.is_store_admin_or_owner(store_id, auth.uid()));

-- Audit logs
CREATE POLICY "Members read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "System insert audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(store_id, auth.uid()));

-- ============ TRIGGERS ============

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-add owner as store member on store creation
CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.store_members (store_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_store_created
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_store();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_slug ON public.products(store_id, slug);
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_status ON public.orders(store_id, status);
CREATE INDEX idx_store_members_user ON public.store_members(user_id);
CREATE INDEX idx_store_members_store ON public.store_members(store_id);
CREATE INDEX idx_customers_store ON public.customers(store_id);
CREATE INDEX idx_audit_logs_store ON public.audit_logs(store_id);
CREATE INDEX idx_stores_slug ON public.stores(slug);

-- Storage bucket for store assets
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true);

CREATE POLICY "Anyone can view store assets" ON storage.objects FOR SELECT USING (bucket_id = 'store-assets');
CREATE POLICY "Auth users upload store assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'store-assets');
CREATE POLICY "Auth users update store assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'store-assets');
CREATE POLICY "Auth users delete store assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'store-assets');
