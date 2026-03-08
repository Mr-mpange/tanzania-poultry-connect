
-- Price history table
CREATE TABLE public.price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL,
  price numeric NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Farmers can view their own price history
CREATE POLICY "Farmers view own price history" ON public.price_history
  FOR SELECT TO authenticated
  USING (auth.uid() = farmer_id);

-- System inserts via trigger (security definer)
CREATE POLICY "System insert price history" ON public.price_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = farmer_id);

-- Trigger to auto-record price changes
CREATE OR REPLACE FUNCTION public.record_price_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.price_per_unit IS DISTINCT FROM NEW.price_per_unit) THEN
    INSERT INTO public.price_history (inventory_id, farmer_id, price)
    VALUES (NEW.id, NEW.farmer_id, NEW.price_per_unit);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_inventory_price_change
  AFTER INSERT OR UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.record_price_change();
