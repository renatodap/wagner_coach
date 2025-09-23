-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'meal-images',
  'meal-images',
  true, -- Public bucket for meal photos
  false, -- No AVIF auto-detection
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
CREATE POLICY "Users can upload their own meal images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own meal images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'meal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own meal images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Comment on the bucket
COMMENT ON TABLE storage.buckets IS 'Storage for meal photo images used in AI analysis';