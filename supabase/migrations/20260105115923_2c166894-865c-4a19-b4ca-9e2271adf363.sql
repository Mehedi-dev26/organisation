-- Create storage bucket for member photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to the pending folder (for registration forms)
CREATE POLICY "Allow anonymous uploads to pending folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'member-photos' 
  AND (storage.foldername(name))[1] = 'pending'
);

-- Allow public read access to all member photos
CREATE POLICY "Allow public read access to member photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-photos');

-- Allow authenticated users (admins) to manage all photos
CREATE POLICY "Allow authenticated users to manage member photos"
ON storage.objects FOR ALL
USING (bucket_id = 'member-photos' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'member-photos' AND auth.role() = 'authenticated');