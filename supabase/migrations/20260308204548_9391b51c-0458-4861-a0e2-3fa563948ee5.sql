
-- Messages table for cross-role communication
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can mark as read"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id);

-- Favorites/Wishlist table for buyers
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, inventory_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
ON public.favorites FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Vehicles table for distributors
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id uuid NOT NULL,
  vehicle_name text NOT NULL,
  plate_number text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'motorcycle',
  capacity_kg numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Distributors view own vehicles"
ON public.vehicles FOR SELECT TO authenticated
USING (auth.uid() = distributor_id);

CREATE POLICY "Distributors insert own vehicles"
ON public.vehicles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = distributor_id);

CREATE POLICY "Distributors update own vehicles"
ON public.vehicles FOR UPDATE TO authenticated
USING (auth.uid() = distributor_id);

CREATE POLICY "Distributors delete own vehicles"
ON public.vehicles FOR DELETE TO authenticated
USING (auth.uid() = distributor_id);

CREATE POLICY "Admin view all vehicles"
ON public.vehicles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin view all messages
CREATE POLICY "Admin view all messages"
ON public.messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
