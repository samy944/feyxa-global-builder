
-- =============================================
-- WORKSPACES & MULTI-STORE ARCHITECTURE
-- =============================================

-- 1) Create workspaces table
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL,
  plan_limit_stores integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 2) Create workspace_members table
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 3) Add workspace_id to stores (nullable for migration, existing stores get linked later)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_stores_workspace_id ON public.stores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);

-- 4) Security definer function: check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  );
$$;

-- 5) Security definer function: check workspace admin/owner
CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id AND role IN ('owner', 'admin')
  );
$$;

-- 6) RLS policies for workspaces
CREATE POLICY "Members read workspaces"
ON public.workspaces FOR SELECT
USING (is_workspace_member(id, auth.uid()));

CREATE POLICY "Owner update workspace"
ON public.workspaces FOR UPDATE
USING (owner_user_id = auth.uid());

CREATE POLICY "Auth create workspace"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

-- 7) RLS policies for workspace_members
CREATE POLICY "Members read workspace members"
ON public.workspace_members FOR SELECT
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admin manage workspace members"
ON public.workspace_members FOR INSERT
WITH CHECK (is_workspace_admin_or_owner(workspace_id, auth.uid()));

CREATE POLICY "Admin delete workspace members"
ON public.workspace_members FOR DELETE
USING (is_workspace_admin_or_owner(workspace_id, auth.uid()) AND role <> 'owner');

-- 8) Trigger: auto-create workspace for new stores without one
CREATE OR REPLACE FUNCTION public.handle_store_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ws_id uuid;
BEGIN
  IF NEW.workspace_id IS NULL THEN
    -- Check if owner already has a workspace
    SELECT wm.workspace_id INTO _ws_id
    FROM workspace_members wm
    WHERE wm.user_id = NEW.owner_id AND wm.role = 'owner'
    LIMIT 1;
    
    IF _ws_id IS NULL THEN
      -- Create workspace
      INSERT INTO workspaces (name, owner_user_id)
      VALUES (NEW.name || ' Workspace', NEW.owner_id)
      RETURNING id INTO _ws_id;
      
      -- Add owner as workspace member
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (_ws_id, NEW.owner_id, 'owner');
    END IF;
    
    NEW.workspace_id := _ws_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_store_workspace
BEFORE INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.handle_store_workspace();

-- 9) updated_at trigger for workspaces
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
