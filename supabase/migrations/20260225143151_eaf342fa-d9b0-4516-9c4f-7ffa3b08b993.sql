
-- =============================================
-- 1. EMAIL PROVIDERS CONFIG
-- =============================================
CREATE TABLE public.email_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'resend', -- resend, smtp, sendgrid, mailgun
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  from_name TEXT NOT NULL DEFAULT 'Feyxa',
  from_email TEXT NOT NULL DEFAULT 'noreply@feyxa.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_providers ENABLE ROW LEVEL SECURITY;

-- Only marketplace admins can manage email providers
CREATE POLICY "Admins manage email providers"
  ON public.email_providers FOR ALL
  USING (public.has_role(auth.uid(), 'marketplace_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin'));

-- =============================================
-- 2. PLATFORM BRANDING
-- =============================================
CREATE TABLE public.platform_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL DEFAULT 'Feyxa',
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#E5FB26',
  secondary_color TEXT NOT NULL DEFAULT '#0E0E11',
  button_color TEXT NOT NULL DEFAULT '#E5FB26',
  button_text_color TEXT NOT NULL DEFAULT '#0E0E11',
  font_family TEXT NOT NULL DEFAULT 'Inter',
  font_heading TEXT NOT NULL DEFAULT 'Clash Display',
  default_image_url TEXT,
  footer_text TEXT DEFAULT '© 2026 Feyxa. Tous droits réservés.',
  footer_links JSONB DEFAULT '[]',
  meta_description TEXT,
  custom_css TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_branding ENABLE ROW LEVEL SECURITY;

-- Everyone can read branding (needed to apply theme)
CREATE POLICY "Anyone can read branding"
  ON public.platform_branding FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins manage branding"
  ON public.platform_branding FOR ALL
  USING (public.has_role(auth.uid(), 'marketplace_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin'));

-- Insert default branding row
INSERT INTO public.platform_branding (platform_name) VALUES ('Feyxa');

-- =============================================
-- 3. EMAIL TEMPLATES
-- =============================================
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  variables JSONB DEFAULT '[]',
  category TEXT NOT NULL DEFAULT 'transactional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email templates"
  ON public.email_templates FOR ALL
  USING (public.has_role(auth.uid(), 'marketplace_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin'));

-- Seed default templates
INSERT INTO public.email_templates (slug, name, subject, html_body, variables, category) VALUES
('otp_verification', 'Code OTP', '{{otp}} — Votre code {{platform_name}}', '<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><div style="background:{{primary_color}};padding:32px 24px;text-align:center"><img src="{{logo_url}}" alt="{{platform_name}}" style="height:40px" /></div><div style="padding:32px 24px"><p style="color:#3f3f46;font-size:15px">Bonjour,</p><p style="color:#3f3f46;font-size:15px">Voici votre code de vérification :</p><div style="background:#f4f4f5;border:2px dashed #d4d4d8;border-radius:10px;padding:24px;text-align:center;margin:24px 0"><div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0E0E11">{{otp}}</div></div><p style="color:#3f3f46;font-size:15px">Ce code expire dans <strong>10 minutes</strong>.</p></div><div style="padding:20px 24px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center"><p style="color:#a1a1aa;font-size:12px">{{footer_text}}</p></div></div>', '["otp", "platform_name", "logo_url", "primary_color", "footer_text"]', 'authentication'),
('order_confirmation', 'Confirmation commande', 'Commande {{order_number}} confirmée — {{platform_name}}', '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)"><div style="background:{{secondary_color}};padding:24px 32px;text-align:center"><img src="{{logo_url}}" alt="{{platform_name}}" style="height:36px" /></div><div style="padding:32px"><h1 style="font-size:22px;color:#1a1a1a">Commande confirmée ✓</h1><p style="color:#6b7280">Bonjour {{customer_name}},</p><p style="color:#374151">Votre commande <strong>{{order_number}}</strong> a bien été enregistrée.</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0">{{order_details}}</div><a href="{{tracking_link}}" style="display:block;text-align:center;background:{{button_color}};color:{{button_text_color}};padding:14px;border-radius:8px;text-decoration:none;font-weight:600">📦 SUIVRE MA COMMANDE</a></div><div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center"><p style="font-size:11px;color:#9ca3af">{{footer_text}}</p></div></div>', '["order_number", "customer_name", "order_details", "tracking_link", "platform_name", "logo_url", "secondary_color", "button_color", "button_text_color", "footer_text"]', 'transactional'),
('welcome', 'Bienvenue', 'Bienvenue sur {{platform_name}} 🎉', '<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden"><div style="background:{{secondary_color}};padding:32px;text-align:center"><img src="{{logo_url}}" alt="{{platform_name}}" style="height:40px" /></div><div style="padding:32px"><h1 style="font-size:24px;color:#1a1a1a">Bienvenue sur {{platform_name}} !</h1><p style="color:#374151">Bonjour {{user_name}},</p><p style="color:#374151">Votre compte a été créé avec succès. Commencez à explorer dès maintenant.</p><a href="{{app_url}}" style="display:block;text-align:center;background:{{button_color}};color:{{button_text_color}};padding:14px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:24px">Commencer</a></div><div style="padding:20px;background:#fafafa;text-align:center"><p style="font-size:12px;color:#a1a1aa">{{footer_text}}</p></div></div>', '["user_name", "app_url", "platform_name", "logo_url", "secondary_color", "button_color", "button_text_color", "footer_text"]', 'transactional');

-- =============================================
-- 4. EMAIL LOGS
-- =============================================
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.email_providers(id),
  template_slug TEXT,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- sent, failed, bounced
  provider_message_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read email logs"
  ON public.email_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'marketplace_admin'));

CREATE POLICY "Service can insert email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_email_logs_created ON public.email_logs (created_at DESC);
CREATE INDEX idx_email_logs_status ON public.email_logs (status);
CREATE INDEX idx_email_logs_recipient ON public.email_logs (recipient);

-- Updated_at triggers
CREATE TRIGGER update_email_providers_updated_at BEFORE UPDATE ON public.email_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_platform_branding_updated_at BEFORE UPDATE ON public.platform_branding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert default Resend provider
INSERT INTO public.email_providers (name, provider_type, is_active, is_default, from_name, from_email, config)
VALUES ('Resend', 'resend', true, true, 'Feyxa', 'onboarding@resend.dev', '{"api_key_secret": "RESEND_API_KEY"}');
