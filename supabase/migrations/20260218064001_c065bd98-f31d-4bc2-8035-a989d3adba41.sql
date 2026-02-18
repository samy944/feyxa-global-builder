
-- Add marketplace publishing toggle to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_marketplace_published boolean NOT NULL DEFAULT false;

-- Add marketplace category reference
CREATE TABLE public.marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  parent_id uuid REFERENCES public.marketplace_categories(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read marketplace categories"
  ON public.marketplace_categories FOR SELECT
  USING (true);

-- Link products to marketplace categories
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS marketplace_category_id uuid REFERENCES public.marketplace_categories(id);

-- Add vendor display fields to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS delivery_delay text DEFAULT '2-5 jours';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS return_policy text DEFAULT 'Retours acceptés sous 7 jours';

-- User roles table for marketplace admin moderation
CREATE TYPE public.app_role AS ENUM ('marketplace_admin', 'marketplace_moderator');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only marketplace admins can manage user_roles
CREATE POLICY "Admins read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'marketplace_admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'marketplace_admin'));

-- Marketplace admins can manage categories
CREATE POLICY "Admins manage marketplace categories"
  ON public.marketplace_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'marketplace_admin'));

-- Add store moderation status
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS ban_reason text;

-- Seed default categories
INSERT INTO public.marketplace_categories (name, slug, sort_order) VALUES
  ('Mode & Vêtements', 'mode-vetements', 1),
  ('Électronique', 'electronique', 2),
  ('Maison & Déco', 'maison-deco', 3),
  ('Beauté & Santé', 'beaute-sante', 4),
  ('Alimentation', 'alimentation', 5),
  ('Sports & Loisirs', 'sports-loisirs', 6),
  ('Auto & Moto', 'auto-moto', 7),
  ('Bébé & Enfants', 'bebe-enfants', 8);
