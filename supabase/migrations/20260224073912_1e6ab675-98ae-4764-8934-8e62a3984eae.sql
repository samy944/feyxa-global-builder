
-- Platform general settings (key-value store)
CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage platform settings"
  ON public.platform_settings FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

CREATE POLICY "Public read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Seed default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('general', '{"site_name": "Feyxa", "site_description": "La marketplace africaine", "default_currency": "XOF", "default_locale": "fr", "maintenance_mode": false, "support_email": "", "support_phone": "", "logo_url": "", "favicon_url": ""}'::jsonb),
  ('seo', '{"meta_title": "Feyxa - Marketplace", "meta_description": "La marketplace e-commerce pour l''Afrique", "og_image_url": ""}'::jsonb),
  ('commissions', '{"default_rate": 0.05, "min_payout": 5000}'::jsonb);

-- Platform plans / pricing tiers
CREATE TABLE public.platform_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  billing_interval text NOT NULL DEFAULT 'monthly',
  features jsonb NOT NULL DEFAULT '[]',
  limits jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  stripe_price_id text,
  fedapay_plan_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage plans"
  ON public.platform_plans FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

CREATE POLICY "Public read active plans"
  ON public.platform_plans FOR SELECT
  USING (is_active = true);

-- Seed default plans
INSERT INTO public.platform_plans (name, slug, description, price, features, limits, is_default, sort_order) VALUES
  ('Gratuit', 'free', 'Pour démarrer', 0, '["10 produits", "1 landing page", "Support communautaire"]'::jsonb, '{"max_products": 10, "max_landings": 1, "max_team_members": 1}'::jsonb, true, 0),
  ('Pro', 'pro', 'Pour les vendeurs actifs', 9900, '["100 produits", "5 landing pages", "Analytics avancés", "Support prioritaire"]'::jsonb, '{"max_products": 100, "max_landings": 5, "max_team_members": 5}'::jsonb, false, 1),
  ('Business', 'business', 'Pour les entreprises', 29900, '["Produits illimités", "Landing pages illimitées", "API access", "Support dédié", "Domaine personnalisé"]'::jsonb, '{"max_products": -1, "max_landings": -1, "max_team_members": 20}'::jsonb, false, 2);

-- Platform payment providers
CREATE TABLE public.platform_payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}',
  supported_countries text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_payment_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payment providers"
  ON public.platform_payment_providers FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

CREATE POLICY "Public read enabled providers"
  ON public.platform_payment_providers FOR SELECT
  USING (is_enabled = true);

-- Seed providers
INSERT INTO public.platform_payment_providers (provider, display_name, config, supported_countries) VALUES
  ('stripe', 'Stripe', '{"description": "Paiement par carte bancaire internationale", "webhook_url": ""}'::jsonb, ARRAY['US','FR','SN','CI','BJ']),
  ('fedapay', 'FedaPay', '{"description": "Paiement mobile et carte pour l''Afrique", "webhook_url": ""}'::jsonb, ARRAY['BJ','CI','SN','TG','CM']),
  ('mobile_money', 'Mobile Money', '{"description": "MTN, Orange, Wave Mobile Money", "operators": ["mtn","orange","wave"]}'::jsonb, ARRAY['BJ','CI','SN','TG','CM','ML','BF']),
  ('cod', 'Paiement à la livraison', '{"description": "Le client paie en espèces à la réception"}'::jsonb, ARRAY['BJ','CI','SN','TG','CM','ML','BF']);

-- Feature flags
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage feature flags"
  ON public.feature_flags FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

CREATE POLICY "Public read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Seed feature flags
INSERT INTO public.feature_flags (key, name, description, category, is_enabled) VALUES
  ('marketplace', 'Marketplace publique', 'Activer la marketplace multi-vendeurs', 'commerce', true),
  ('reviews', 'Avis clients', 'Permettre aux acheteurs de laisser des avis', 'commerce', true),
  ('escrow', 'Système Escrow', 'Blocage des fonds pendant 7 jours', 'paiement', true),
  ('ab_testing', 'A/B Testing Landing', 'Permettre les tests A/B sur les landing pages', 'marketing', true),
  ('visual_search', 'Recherche visuelle', 'Recherche de produits par image', 'commerce', false),
  ('ai_assistant', 'Assistant IA', 'Chatbot IA pour les vendeurs', 'ai', true),
  ('custom_domains', 'Domaines personnalisés', 'Permettre aux vendeurs de connecter leur domaine', 'infrastructure', false),
  ('multi_currency', 'Multi-devises', 'Support de plusieurs devises par boutique', 'commerce', false),
  ('whatsapp_notifications', 'Notifications WhatsApp', 'Envoyer des notifications via WhatsApp', 'communication', true),
  ('kyc_verification', 'Vérification KYC', 'Vérification d''identité des vendeurs', 'sécurité', true);
