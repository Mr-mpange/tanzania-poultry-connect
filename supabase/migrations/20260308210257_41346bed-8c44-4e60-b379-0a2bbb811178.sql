-- Add image_url column to inventory
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS image_url text;

-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload product images
CREATE POLICY "Farmers upload product images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read access
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow farmers to delete their own images
CREATE POLICY "Users delete own product images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');