
-- Create store tracking settings table
CREATE TABLE public.store_tracking_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  meta_pixel_id text,
  tiktok_pixel_id text,
  google_tag_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (store_id)
);

-- Enable RLS
ALTER TABLE public.store_tracking_settings ENABLE ROW LEVEL SECURITY;

-- Owner/admin can manage their store's tracking settings
CREATE POLICY "Admin/owner manage tracking settings"
ON public.store_tracking_settings
FOR ALL
USING (is_store_admin_or_owner(store_id, auth.uid()))
WITH CHECK (is_store_admin_or_owner(store_id, auth.uid()));

-- Members can read tracking settings
CREATE POLICY "Members read tracking settings"
ON public.store_tracking_settings
FOR SELECT
USING (is_store_member(store_id, auth.uid()));

-- Public read for active stores (needed for pixel injection on storefront)
CREATE POLICY "Public read tracking for active stores"
ON public.store_tracking_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = store_tracking_settings.store_id
      AND stores.is_active = true
      AND stores.is_banned = false
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_store_tracking_settings_updated_at
BEFORE UPDATE ON public.store_tracking_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
