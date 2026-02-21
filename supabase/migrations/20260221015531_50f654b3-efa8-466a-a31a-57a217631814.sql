-- Notifications table for vendor alerts
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'trend',
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_notifications_store_unread ON public.notifications (store_id, is_read, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies: vendors can only read/update their own notifications
CREATE POLICY "Members read notifications"
  ON public.notifications FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

CREATE POLICY "Members mark notifications read"
  ON public.notifications FOR UPDATE
  USING (is_store_member(store_id, auth.uid()));

-- Enable realtime for instant notification delivery
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;