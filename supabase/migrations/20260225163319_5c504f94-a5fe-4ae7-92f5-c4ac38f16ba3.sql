
-- Table for vendor manual expenses (delivery costs, advertising, etc.)
CREATE TABLE public.vendor_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  label text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_expenses ENABLE ROW LEVEL SECURITY;

-- Store members can read expenses
CREATE POLICY "Store members read expenses"
ON public.vendor_expenses FOR SELECT
USING (is_store_member(store_id, auth.uid()));

-- Store admin/owner can manage expenses
CREATE POLICY "Admin/owner manage expenses"
ON public.vendor_expenses FOR ALL
USING (is_store_admin_or_owner(store_id, auth.uid()))
WITH CHECK (is_store_admin_or_owner(store_id, auth.uid()));

-- Marketplace admins can read all expenses
CREATE POLICY "Marketplace admins read expenses"
ON public.vendor_expenses FOR SELECT
USING (has_role(auth.uid(), 'marketplace_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_vendor_expenses_updated_at
BEFORE UPDATE ON public.vendor_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
