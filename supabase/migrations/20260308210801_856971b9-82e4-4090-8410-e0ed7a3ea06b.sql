-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, inventory_id, order_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);

-- Buyers can insert their own reviews
CREATE POLICY "Buyers insert own reviews" ON public.reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own reviews
CREATE POLICY "Buyers update own reviews" ON public.reviews FOR UPDATE TO authenticated
USING (auth.uid() = buyer_id);

-- Buyers can delete their own reviews
CREATE POLICY "Buyers delete own reviews" ON public.reviews FOR DELETE TO authenticated
USING (auth.uid() = buyer_id);