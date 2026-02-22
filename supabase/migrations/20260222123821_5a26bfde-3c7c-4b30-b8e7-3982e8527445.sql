
-- Table to store tracking events aggregated per store/day/event_type
CREATE TABLE public.tracking_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- page_view, view_content, add_to_cart, initiate_checkout, purchase
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  event_count integer NOT NULL DEFAULT 1,
  event_value numeric NOT NULL DEFAULT 0, -- total monetary value for the day
  currency text NOT NULL DEFAULT 'XOF',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, event_type, event_date)
);

-- Enable RLS
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Store members can read their tracking events
CREATE POLICY "Members read tracking events"
  ON public.tracking_events FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

-- Public insert (anonymous visitors fire events)
CREATE POLICY "Anon insert tracking events"
  ON public.tracking_events FOR INSERT
  WITH CHECK (store_id IS NOT NULL AND event_type IS NOT NULL);

-- Allow upsert (update count on conflict)
CREATE POLICY "Anon update tracking events"
  ON public.tracking_events FOR UPDATE
  USING (true);

-- Index for fast queries
CREATE INDEX idx_tracking_events_store_date ON public.tracking_events(store_id, event_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_tracking_events_updated_at
  BEFORE UPDATE ON public.tracking_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
