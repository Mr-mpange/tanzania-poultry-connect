
-- Trigger: when delivery status changes, auto-update the linked order status
CREATE OR REPLACE FUNCTION public.sync_delivery_to_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.orders
    SET status = NEW.status::order_status,
        updated_at = now()
    WHERE id = NEW.order_id
      AND status::text <> NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_delivery_to_order ON public.deliveries;
CREATE TRIGGER trg_sync_delivery_to_order
AFTER UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.sync_delivery_to_order();

-- Trigger: when distributor claims an order, auto-set status to processing
CREATE OR REPLACE FUNCTION public.sync_order_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.distributor_id IS NULL AND NEW.distributor_id IS NOT NULL AND NEW.status IN ('confirmed', 'processing') THEN
    NEW.status := 'processing';
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_claim ON public.orders;
CREATE TRIGGER trg_sync_order_claim
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_order_claim();
