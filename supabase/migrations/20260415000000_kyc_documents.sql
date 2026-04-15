-- KYC status enum (safe create)
DO $$ BEGIN
  CREATE TYPE public.kyc_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add kyc_status to profiles (safe)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status public.kyc_status NOT NULL DEFAULT 'pending';

-- Add kyc_status to vehicles (safe)
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS kyc_status public.kyc_status NOT NULL DEFAULT 'pending';

-- KYC documents for users
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  doc_url text NOT NULL,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  admin_note text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone
);

-- KYC documents for vehicles
CREATE TABLE IF NOT EXISTS public.vehicle_kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  distributor_id uuid NOT NULL,
  doc_type text NOT NULL,
  doc_url text NOT NULL,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  admin_note text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone
);

-- RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_kyc_documents ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before recreating
DROP POLICY IF EXISTS "users_own_kyc" ON public.kyc_documents;
DROP POLICY IF EXISTS "admin_read_kyc" ON public.kyc_documents;
DROP POLICY IF EXISTS "admin_update_kyc" ON public.kyc_documents;
DROP POLICY IF EXISTS "distributor_vehicle_kyc" ON public.vehicle_kyc_documents;
DROP POLICY IF EXISTS "admin_read_vehicle_kyc" ON public.vehicle_kyc_documents;
DROP POLICY IF EXISTS "admin_update_vehicle_kyc" ON public.vehicle_kyc_documents;

CREATE POLICY "users_own_kyc" ON public.kyc_documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_read_kyc" ON public.kyc_documents
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_update_kyc" ON public.kyc_documents
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "distributor_vehicle_kyc" ON public.vehicle_kyc_documents
  FOR ALL USING (auth.uid() = distributor_id);

CREATE POLICY "admin_read_vehicle_kyc" ON public.vehicle_kyc_documents
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_update_vehicle_kyc" ON public.vehicle_kyc_documents
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
