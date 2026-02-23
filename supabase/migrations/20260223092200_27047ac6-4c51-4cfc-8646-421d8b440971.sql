
-- ============================================
-- FEYXA MARKETING INTELLIGENCE TABLES
-- ============================================

-- 1) Tracking Links (short links)
CREATE TABLE public.tracking_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  source text NOT NULL, -- facebook, instagram, whatsapp, tiktok, google
  medium text NOT NULL DEFAULT 'social',
  campaign text,
  content text, -- note/identifiant du post
  short_code text NOT NULL UNIQUE,
  target_url text NOT NULL,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracking_links_store ON public.tracking_links(store_id);
CREATE INDEX idx_tracking_links_short_code ON public.tracking_links(short_code);

ALTER TABLE public.tracking_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members manage tracking links"
  ON public.tracking_links FOR ALL
  USING (is_store_member(store_id, auth.uid()))
  WITH CHECK (is_store_member(store_id, auth.uid()));

CREATE POLICY "Public read tracking links by code"
  ON public.tracking_links FOR SELECT
  USING (true);

-- 2) Tracking Sessions (visitor sessions)
CREATE TABLE public.tracking_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL, -- client-generated session ID
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  -- First touch attribution
  first_source text,
  first_medium text,
  first_campaign text,
  first_content text,
  first_referrer text,
  first_tracking_link_id uuid REFERENCES public.tracking_links(id) ON DELETE SET NULL,
  -- Last touch attribution
  last_source text,
  last_medium text,
  last_campaign text,
  last_content text,
  last_referrer text,
  last_tracking_link_id uuid REFERENCES public.tracking_links(id) ON DELETE SET NULL,
  -- Timestamps
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  page_views integer NOT NULL DEFAULT 1,
  UNIQUE(session_id, store_id)
);

CREATE INDEX idx_tracking_sessions_store ON public.tracking_sessions(store_id);
CREATE INDEX idx_tracking_sessions_session ON public.tracking_sessions(session_id);

ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon insert tracking sessions"
  ON public.tracking_sessions FOR INSERT
  WITH CHECK (store_id IS NOT NULL AND session_id IS NOT NULL);

CREATE POLICY "Anon update tracking sessions"
  ON public.tracking_sessions FOR UPDATE
  USING (store_id IS NOT NULL);

CREATE POLICY "Store members read sessions"
  ON public.tracking_sessions FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

-- 3) Analytics Events (enriched with session)
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  session_id text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- page_view, view_content, add_to_cart, initiate_checkout, purchase
  event_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_store ON public.analytics_events(store_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(store_id, event_type);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (store_id IS NOT NULL AND event_type IS NOT NULL);

CREATE POLICY "Store members read analytics events"
  ON public.analytics_events FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

-- 4) Order Attributions
CREATE TABLE public.order_attributions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  session_id text,
  -- Last touch
  last_source text,
  last_medium text,
  last_campaign text,
  last_content text,
  tracking_link_id uuid REFERENCES public.tracking_links(id) ON DELETE SET NULL,
  -- First touch
  first_source text,
  first_medium text,
  first_campaign text,
  first_content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_attributions_store ON public.order_attributions(store_id);
CREATE INDEX idx_order_attributions_link ON public.order_attributions(tracking_link_id);

ALTER TABLE public.order_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon insert order attributions"
  ON public.order_attributions FOR INSERT
  WITH CHECK (store_id IS NOT NULL AND order_id IS NOT NULL);

CREATE POLICY "Store members read order attributions"
  ON public.order_attributions FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

-- Allow public update of click_count on tracking_links
CREATE POLICY "Public increment click count"
  ON public.tracking_links FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at on tracking_links
CREATE TRIGGER update_tracking_links_updated_at
  BEFORE UPDATE ON public.tracking_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
