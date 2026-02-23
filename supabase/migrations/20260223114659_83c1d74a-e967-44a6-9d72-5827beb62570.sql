
-- Add client and vendor values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Function to auto-assign role on signup (called from trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Read role from user metadata set during signup
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'account_type')::app_role,
    'client'::app_role
  );
  
  -- Only insert client or vendor roles
  IF _role IN ('client', 'vendor') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign role on new user creation
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- RLS policy: users can read their own roles
CREATE POLICY "Users read own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());
