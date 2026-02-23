
-- 1) Extend store_role enum with new roles
ALTER TYPE store_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE store_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE store_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE store_role ADD VALUE IF NOT EXISTS 'viewer';

-- 2) Create invitation status enum
DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3) Create store_invitations table
CREATE TABLE public.store_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  role store_role NOT NULL DEFAULT 'staff',
  token_hash text NOT NULL UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  invited_by uuid NOT NULL,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_invitations_store ON public.store_invitations(store_id, status);
CREATE INDEX idx_store_invitations_email ON public.store_invitations(email, status);
CREATE INDEX idx_store_invitations_token ON public.store_invitations(token_hash);

ALTER TABLE public.store_invitations ENABLE ROW LEVEL SECURITY;

-- Store admins/owners can manage invitations
CREATE POLICY "Store admins manage invitations"
  ON public.store_invitations FOR ALL
  USING (is_store_admin_or_owner(store_id, auth.uid()))
  WITH CHECK (is_store_admin_or_owner(store_id, auth.uid()));

-- Users can read invitations sent to their email
CREATE POLICY "Users read own invitations"
  ON public.store_invitations FOR SELECT
  USING (
    email = (SELECT auth.jwt() ->> 'email')
    OR is_store_member(store_id, auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_store_invitations_updated_at
  BEFORE UPDATE ON public.store_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4) Function to accept invitation by token hash
CREATE OR REPLACE FUNCTION public.accept_invitation(_token_hash text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv store_invitations%ROWTYPE;
  _result jsonb;
BEGIN
  SELECT * INTO _inv FROM store_invitations
  WHERE token_hash = _token_hash AND status = 'pending'
  FOR UPDATE;

  IF _inv.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation introuvable ou déjà utilisée');
  END IF;

  IF _inv.expires_at < now() THEN
    UPDATE store_invitations SET status = 'expired' WHERE id = _inv.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invitation expirée');
  END IF;

  -- Check if already a member
  IF EXISTS (SELECT 1 FROM store_members WHERE store_id = _inv.store_id AND user_id = _user_id) THEN
    UPDATE store_invitations SET status = 'accepted', accepted_by = _user_id WHERE id = _inv.id;
    RETURN jsonb_build_object('success', true, 'store_id', _inv.store_id, 'message', 'Déjà membre de cette boutique');
  END IF;

  -- Add as store member
  INSERT INTO store_members (store_id, user_id, role)
  VALUES (_inv.store_id, _user_id, _inv.role);

  -- Mark invitation as accepted
  UPDATE store_invitations SET status = 'accepted', accepted_by = _user_id WHERE id = _inv.id;

  -- Audit log
  INSERT INTO audit_logs (store_id, user_id, action, target_type, target_id, metadata)
  VALUES (_inv.store_id, _user_id, 'invite_accepted', 'store_invitation', _inv.id::text,
    jsonb_build_object('email', _inv.email, 'role', _inv.role::text));

  RETURN jsonb_build_object('success', true, 'store_id', _inv.store_id, 'role', _inv.role::text);
END;
$$;

-- 5) Security definer to check store role permissions
CREATE OR REPLACE FUNCTION public.get_member_permissions(_store_id uuid, _user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE get_store_role(_store_id, _user_id)
    WHEN 'owner' THEN ARRAY['all', 'products', 'orders', 'customers', 'analytics', 'marketing', 'shipping', 'wallet', 'settings', 'team', 'delete_store']
    WHEN 'admin' THEN ARRAY['products', 'orders', 'customers', 'analytics', 'marketing', 'shipping', 'wallet', 'settings', 'team']
    WHEN 'manager' THEN ARRAY['products', 'orders', 'customers', 'analytics']
    WHEN 'support' THEN ARRAY['orders', 'tickets', 'returns']
    WHEN 'finance' THEN ARRAY['wallet', 'analytics', 'orders']
    WHEN 'viewer' THEN ARRAY['read_only']
    ELSE ARRAY[]::text[]
  END;
$$;
