
-- ============================================
-- FEYXA INFRASTRUCTURE ENGINE — Event Bus
-- ============================================

-- 1) events_log: central event table
CREATE TABLE public.events_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  store_id uuid REFERENCES public.stores(id),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_events_log_status ON public.events_log(status);
CREATE INDEX idx_events_log_event_type ON public.events_log(event_type);
CREATE INDEX idx_events_log_store_id ON public.events_log(store_id);
CREATE INDEX idx_events_log_retry ON public.events_log(status, next_retry_at) WHERE status = 'failed';
CREATE INDEX idx_events_log_created ON public.events_log(created_at DESC);

-- 2) event_handlers_log: trace each handler execution
CREATE TABLE public.event_handlers_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events_log(id) ON DELETE CASCADE,
  handler_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  duration_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_handlers_event_id ON public.event_handlers_log(event_id);

-- 3) RLS for events_log
ALTER TABLE public.events_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members read events"
  ON public.events_log FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

CREATE POLICY "Marketplace admins read all events"
  ON public.events_log FOR SELECT
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- No direct INSERT/UPDATE/DELETE from client — only via service_role in edge functions

-- 4) RLS for event_handlers_log
ALTER TABLE public.event_handlers_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read handlers via event"
  ON public.event_handlers_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events_log e
      WHERE e.id = event_handlers_log.event_id
        AND (is_store_member(e.store_id, auth.uid()) OR has_role(auth.uid(), 'marketplace_admin'::app_role))
    )
  );

-- 5) Enable realtime for monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.events_log;
