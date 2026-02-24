
-- ═══════════════════════════════════════════
-- SECURITY SYSTEM: OTP, KYC, Activity Logs
-- ═══════════════════════════════════════════

-- 1) OTP codes for 2FA
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL DEFAULT 'login_2fa', -- login_2fa, withdrawal, email_verify
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  used_at timestamp with time zone,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own OTP codes"
  ON public.otp_codes FOR SELECT
  USING (auth.uid() = user_id);

-- No direct insert/update from client - managed by edge function
-- Service role handles insert/update

CREATE INDEX idx_otp_codes_user_purpose ON public.otp_codes (user_id, purpose, created_at DESC);

-- 2) Vendor KYC
CREATE TYPE public.kyc_status AS ENUM ('not_started', 'pending', 'approved', 'rejected');

CREATE TABLE public.vendor_kyc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  id_document_url text,
  id_document_type text DEFAULT 'national_id', -- national_id, passport, driver_license
  selfie_url text,
  status public.kyc_status NOT NULL DEFAULT 'not_started',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own KYC"
  ON public.vendor_kyc FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own KYC"
  ON public.vendor_kyc FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own KYC pending"
  ON public.vendor_kyc FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('not_started', 'rejected'));

CREATE POLICY "Admins read all KYC"
  ON public.vendor_kyc FOR SELECT
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role));

CREATE POLICY "Admins update KYC"
  ON public.vendor_kyc FOR UPDATE
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role));

CREATE INDEX idx_vendor_kyc_status ON public.vendor_kyc (status);

-- 3) Login activity logs
CREATE TABLE public.login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text,
  user_agent text,
  device_info jsonb DEFAULT '{}',
  country text,
  city text,
  success boolean NOT NULL DEFAULT true,
  failure_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own login activity"
  ON public.login_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all login activity"
  ON public.login_activity FOR SELECT
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role));

CREATE INDEX idx_login_activity_user ON public.login_activity (user_id, created_at DESC);
CREATE INDEX idx_login_activity_ip ON public.login_activity (ip_address, created_at DESC);

-- 4) User security settings (2FA preferences)
CREATE TABLE public.user_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  two_factor_method text DEFAULT 'email', -- email, sms, totp
  require_2fa_withdrawal boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own security settings"
  ON public.user_security_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own security settings"
  ON public.user_security_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own security settings"
  ON public.user_security_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- 5) Rate limiting helper function
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(_identifier text, _window_minutes int DEFAULT 15, _max_attempts int DEFAULT 10)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*) FROM public.login_activity
    WHERE ip_address = _identifier
      AND success = false
      AND created_at > (now() - (_window_minutes || ' minutes')::interval)
  ) < _max_attempts;
$$;

-- 6) Storage bucket for KYC documents (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

CREATE POLICY "Users upload own KYC docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own KYC docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins read all KYC docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND has_role(auth.uid(), 'marketplace_admin'::app_role));
