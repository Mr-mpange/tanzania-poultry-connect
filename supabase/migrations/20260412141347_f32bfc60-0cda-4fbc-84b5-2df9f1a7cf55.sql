
CREATE POLICY "dist_claim_orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  distributor_id IS NULL
  AND status IN ('confirmed', 'processing', 'picked_up')
  AND has_role(auth.uid(), 'distributor'::app_role)
);
