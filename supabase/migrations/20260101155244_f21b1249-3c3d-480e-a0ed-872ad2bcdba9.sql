-- Create storage bucket for member photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-photos', 
  'member-photos', 
  true,
  524288, -- 512KB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow anyone to view member photos (public bucket)
CREATE POLICY "Public can view member photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-photos');

-- Only admins can upload member photos
CREATE POLICY "Admins can upload member photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'member-photos' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can update member photos
CREATE POLICY "Admins can update member photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'member-photos' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can delete member photos
CREATE POLICY "Admins can delete member photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'member-photos' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);