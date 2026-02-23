-- Create landing_subpages table for multi-page landing sites
CREATE TABLE public.landing_subpages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_home BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_landing_subpages_page_order ON public.landing_subpages (landing_page_id, sort_order);

-- Unique slug per landing page
CREATE UNIQUE INDEX idx_landing_subpages_unique_slug ON public.landing_subpages (landing_page_id, slug);

-- Enable RLS
ALTER TABLE public.landing_subpages ENABLE ROW LEVEL SECURITY;

-- Public can read subpages of published landings
CREATE POLICY "Public read published subpages"
ON public.landing_subpages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.landing_pages lp
    WHERE lp.id = landing_subpages.landing_page_id
    AND lp.status = 'published'
  )
);

-- Store members can manage subpages
CREATE POLICY "Store members manage subpages"
ON public.landing_subpages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.landing_pages lp
    WHERE lp.id = landing_subpages.landing_page_id
    AND is_store_member(lp.store_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.landing_pages lp
    WHERE lp.id = landing_subpages.landing_page_id
    AND is_store_member(lp.store_id, auth.uid())
  )
);