
-- Add KYC fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS id_number text,
ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS license_image_url text;

-- Add vehicle_id to deliveries
ALTER TABLE public.deliveries
ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.vehicles(id);

-- Create KYC documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- KYC storage policies
CREATE POLICY "Users can upload own KYC docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own KYC docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users can update own KYC docs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
