
-- Create marketplace listing status enum
CREATE TYPE public.marketplace_listing_status AS ENUM ('hidden', 'submitted', 'approved', 'published', 'rejected');

-- Create marketplace_listings table
CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status marketplace_listing_status NOT NULL DEFAULT 'hidden',
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Store members can read their own listings
CREATE POLICY "Store members read own listings"
  ON public.marketplace_listings FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

-- Store admins/owners can insert listings (submit)
CREATE POLICY "Store admins insert listings"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (is_store_admin_or_owner(store_id, auth.uid()));

-- Store admins/owners can update their listings (but not status to approved/published)
CREATE POLICY "Store admins update own listings"
  ON public.marketplace_listings FOR UPDATE
  USING (is_store_admin_or_owner(store_id, auth.uid()));

-- Store admins can delete their listings
CREATE POLICY "Store admins delete own listings"
  ON public.marketplace_listings FOR DELETE
  USING (is_store_admin_or_owner(store_id, auth.uid()));

-- Marketplace admins can do everything
CREATE POLICY "Marketplace admins manage all listings"
  ON public.marketplace_listings FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- Public can read published listings only
CREATE POLICY "Public read published listings"
  ON public.marketplace_listings FOR SELECT
  USING (status = 'published');

-- Add updated_at trigger
CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for marketplace_listings
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;
