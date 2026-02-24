
-- Update is_store_member to also return true for marketplace_admin
CREATE OR REPLACE FUNCTION public.is_store_member(_store_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE store_id = _store_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'marketplace_admin'
  )
$$;

-- Update is_store_admin_or_owner to also return true for marketplace_admin
CREATE OR REPLACE FUNCTION public.is_store_admin_or_owner(_store_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT public.get_store_role(_store_id, _user_id) IN ('owner', 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'marketplace_admin'
  )
$$;
