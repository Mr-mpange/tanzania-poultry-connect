
-- Add GPS coordinates to deliveries for live tracking
ALTER TABLE public.deliveries
  ADD COLUMN current_lat numeric,
  ADD COLUMN current_lng numeric,
  ADD COLUMN last_location_update timestamp with time zone;

-- Enable realtime for deliveries
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
