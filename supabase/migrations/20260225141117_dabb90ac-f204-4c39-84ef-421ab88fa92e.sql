
-- 1. Fix store-assets storage policies: restrict to store members only
DROP POLICY IF EXISTS "Auth users upload store assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update store assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete store assets" ON storage.objects;

-- Upload: users can only upload to their own stores
CREATE POLICY "Store members upload to own store" 
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store-assets' 
    AND (
      (storage.foldername(name))[1]::uuid IN (
        SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
        UNION
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
      )
    )
  );

-- Update: users can only update their store's assets
CREATE POLICY "Store members update own store assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND (
      (storage.foldername(name))[1]::uuid IN (
        SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
        UNION
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
      )
    )
  );

-- Delete: only store admins/owners
CREATE POLICY "Store admins delete own store assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND (
      (storage.foldername(name))[1]::uuid IN (
        SELECT s.id FROM public.stores s WHERE s.owner_id = auth.uid()
        UNION
        SELECT sm.store_id FROM public.store_members sm 
        WHERE sm.user_id = auth.uid() AND sm.role IN ('admin', 'owner')
      )
    )
  );

-- 2. Fix platform_settings: restrict sensitive settings from public
DROP POLICY IF EXISTS "Public read platform settings" ON public.platform_settings;

CREATE POLICY "Authenticated read platform settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon read public settings"
  ON public.platform_settings FOR SELECT
  TO anon
  USING (key IN ('general', 'seo'));

-- 3. Fix feature_flags: restrict to authenticated users
DROP POLICY IF EXISTS "Public read feature flags" ON public.feature_flags;

CREATE POLICY "Authenticated read feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- 4. Fix platform_payment_providers: restrict config exposure
DROP POLICY IF EXISTS "Public read enabled providers" ON public.platform_payment_providers;

CREATE POLICY "Authenticated read enabled providers"
  ON public.platform_payment_providers FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- 5. Add INSERT policy for notifications (store members can create)
CREATE POLICY "Store members insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (is_store_member(store_id, auth.uid()));
