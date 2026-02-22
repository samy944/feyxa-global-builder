
CREATE OR REPLACE FUNCTION public.upsert_tracking_event(
  _store_id uuid,
  _event_type text,
  _event_date date,
  _value numeric DEFAULT 0,
  _currency text DEFAULT 'XOF'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO tracking_events (store_id, event_type, event_date, event_count, event_value, currency)
  VALUES (_store_id, _event_type, _event_date, 1, _value, _currency)
  ON CONFLICT (store_id, event_type, event_date)
  DO UPDATE SET
    event_count = tracking_events.event_count + 1,
    event_value = tracking_events.event_value + EXCLUDED.event_value,
    updated_at = now();
END;
$$;
