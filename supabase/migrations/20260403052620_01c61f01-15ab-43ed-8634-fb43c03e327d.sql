-- Allow distributors to see unclaimed orders available for delivery
CREATE POLICY "dist_view_available_orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  distributor_id IS NULL
  AND status IN ('confirmed', 'processing', 'picked_up')
  AND public.has_role(auth.uid(), 'distributor'::app_role)
);