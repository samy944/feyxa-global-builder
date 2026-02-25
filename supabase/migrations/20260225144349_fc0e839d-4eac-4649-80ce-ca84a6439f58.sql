-- Create a dedicated public bucket for branding assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read branding assets
CREATE POLICY "Public read branding assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding-assets');

-- Only marketplace admins can upload branding assets
CREATE POLICY "Admins upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding-assets'
  AND has_role(auth.uid(), 'marketplace_admin'::app_role)
);

-- Only marketplace admins can update branding assets
CREATE POLICY "Admins update branding assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding-assets'
  AND has_role(auth.uid(), 'marketplace_admin'::app_role)
);

-- Only marketplace admins can delete branding assets
CREATE POLICY "Admins delete branding assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding-assets'
  AND has_role(auth.uid(), 'marketplace_admin'::app_role)
);