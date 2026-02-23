
-- Landing page status enum
CREATE TYPE public.landing_status AS ENUM ('draft', 'published', 'archived');

-- Landing pages table
CREATE TABLE public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  status landing_status NOT NULL DEFAULT 'draft',
  template_id text NOT NULL DEFAULT 'one-product',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_title text,
  seo_description text,
  og_image_url text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  theme jsonb DEFAULT '{"primaryColor":"#3b82f6","bgColor":"#ffffff","textColor":"#0f172a","radius":"0.5rem","fontHeading":"Clash Display","fontBody":"Manrope"}'::jsonb,
  ab_enabled boolean NOT NULL DEFAULT false,
  ab_split integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- A/B variant metrics table
CREATE TABLE public.landing_ab_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  variant_name text NOT NULL DEFAULT 'A',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  views integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  add_to_carts integer NOT NULL DEFAULT 0,
  purchases integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(landing_page_id, variant_name)
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_ab_variants ENABLE ROW LEVEL SECURITY;

-- RLS: landing_pages
CREATE POLICY "Store members manage their landings"
  ON public.landing_pages FOR ALL
  USING (is_store_member(store_id, auth.uid()))
  WITH CHECK (is_store_member(store_id, auth.uid()));

CREATE POLICY "Public read published landings"
  ON public.landing_pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "Marketplace admins moderate landings"
  ON public.landing_pages FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'));

-- RLS: landing_ab_variants
CREATE POLICY "Store members manage variants"
  ON public.landing_ab_variants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.landing_pages lp
    WHERE lp.id = landing_ab_variants.landing_page_id
    AND is_store_member(lp.store_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.landing_pages lp
    WHERE lp.id = landing_ab_variants.landing_page_id
    AND is_store_member(lp.store_id, auth.uid())
  ));

CREATE POLICY "Public read published variants"
  ON public.landing_ab_variants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.landing_pages lp
    WHERE lp.id = landing_ab_variants.landing_page_id
    AND lp.status = 'published'
  ));

-- Allow anon to increment variant metrics
CREATE POLICY "Anon update variant metrics"
  ON public.landing_ab_variants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.landing_pages lp
    WHERE lp.id = landing_ab_variants.landing_page_id
    AND lp.status = 'published'
  ));

-- Updated at triggers
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_landing_ab_variants_updated_at
  BEFORE UPDATE ON public.landing_ab_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for public slug lookups
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_store_status ON public.landing_pages(store_id, status);
