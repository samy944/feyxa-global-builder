
-- Revisions table for versioning/rollback
CREATE TABLE public.landing_revisions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.landing_ab_variants(id) ON DELETE SET NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme jsonb,
  author_id uuid,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_landing_revisions_page ON public.landing_revisions(landing_page_id, created_at DESC);

ALTER TABLE public.landing_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members manage revisions"
ON public.landing_revisions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM landing_pages lp
    WHERE lp.id = landing_revisions.landing_page_id
    AND is_store_member(lp.store_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM landing_pages lp
    WHERE lp.id = landing_revisions.landing_page_id
    AND is_store_member(lp.store_id, auth.uid())
  )
);
