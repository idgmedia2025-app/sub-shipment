
-- 1. Function: sync shipment status from latest tracking event
CREATE OR REPLACE FUNCTION public.sync_shipment_status_from_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _latest_status TEXT;
  _shipment_id UUID;
BEGIN
  -- Determine the shipment_id based on operation
  IF TG_OP = 'DELETE' THEN
    _shipment_id := OLD.shipment_id;
  ELSE
    _shipment_id := NEW.shipment_id;
  END IF;

  -- Get the latest event status for this shipment
  SELECT status INTO _latest_status
  FROM public.tracking_events
  WHERE shipment_id = _shipment_id AND status IS NOT NULL
  ORDER BY event_time DESC
  LIMIT 1;

  -- Update shipment status if we found a valid status
  IF _latest_status IS NOT NULL THEN
    UPDATE public.shipments
    SET status = _latest_status, updated_at = now()
    WHERE id = _shipment_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Trigger on tracking_events for INSERT/UPDATE/DELETE
CREATE TRIGGER trg_sync_shipment_status
AFTER INSERT OR UPDATE OR DELETE ON public.tracking_events
FOR EACH ROW
EXECUTE FUNCTION public.sync_shipment_status_from_events();

-- 3. Function: auto-create tracking event when shipment status is manually changed
CREATE OR REPLACE FUNCTION public.auto_create_tracking_event_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if there's already a tracking event with this status at this exact moment
    -- to prevent infinite loops with the other trigger
    IF NOT EXISTS (
      SELECT 1 FROM public.tracking_events
      WHERE shipment_id = NEW.id
        AND status = NEW.status
        AND event_time >= now() - interval '2 seconds'
    ) THEN
      INSERT INTO public.tracking_events (shipment_id, event_time, location, description, status, created_by)
      VALUES (
        NEW.id,
        now(),
        NEW.origin,
        'Status changed to ' || NEW.status,
        NEW.status,
        NEW.updated_by
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Trigger on shipments for status change
CREATE TRIGGER trg_auto_tracking_event_on_status
AFTER UPDATE OF status ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_tracking_event_on_status_change();
