
-- Table for admin invitations (super admin inviting other admins)
CREATE TABLE public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only marketplace admins can manage admin invitations
CREATE POLICY "Admins manage admin invitations"
  ON public.admin_invitations FOR ALL
  USING (has_role(auth.uid(), 'marketplace_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- Function to accept admin invitation
CREATE OR REPLACE FUNCTION public.accept_admin_invitation(_token_hash text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _inv admin_invitations%ROWTYPE;
BEGIN
  SELECT * INTO _inv FROM admin_invitations
  WHERE token_hash = _token_hash AND status = 'pending'
  FOR UPDATE;

  IF _inv.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation introuvable ou déjà utilisée');
  END IF;

  IF _inv.expires_at < now() THEN
    UPDATE admin_invitations SET status = 'expired' WHERE id = _inv.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invitation expirée');
  END IF;

  -- Add marketplace_admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (_user_id, 'marketplace_admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE admin_invitations SET status = 'accepted', accepted_by = _user_id WHERE id = _inv.id;

  RETURN jsonb_build_object('success', true);
END;
$$;
