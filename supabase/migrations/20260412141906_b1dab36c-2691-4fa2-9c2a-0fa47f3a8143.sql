
CREATE POLICY "buyer_view_deliveries"
ON public.deliveries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = deliveries.order_id
    AND orders.buyer_id = auth.uid()
  )
);
