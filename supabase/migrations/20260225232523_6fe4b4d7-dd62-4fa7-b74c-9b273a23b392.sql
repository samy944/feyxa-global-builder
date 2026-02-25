
-- Fix 1: Replace overly permissive storage policies with store-scoped ones

DROP POLICY IF EXISTS "Auth users upload store assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update store assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete store assets" ON storage.objects;

-- Store members can upload assets to their store's folder
CREATE POLICY "Store members upload assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.store_members
        WHERE store_id = (storage.foldername(name))[1]::uuid
        AND user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.stores
        WHERE id = (storage.foldername(name))[1]::uuid
        AND owner_id = auth.uid()
      )
    )
  );

-- Store members can update assets in their store's folder
CREATE POLICY "Store members update assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.store_members
        WHERE store_id = (storage.foldername(name))[1]::uuid
        AND user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.stores
        WHERE id = (storage.foldername(name))[1]::uuid
        AND owner_id = auth.uid()
      )
    )
  );

-- Only store admins/owners can delete assets
CREATE POLICY "Store admins delete assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.store_members sm
        WHERE sm.store_id = (storage.foldername(name))[1]::uuid
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1 FROM public.stores
        WHERE id = (storage.foldername(name))[1]::uuid
        AND owner_id = auth.uid()
      )
    )
  );
