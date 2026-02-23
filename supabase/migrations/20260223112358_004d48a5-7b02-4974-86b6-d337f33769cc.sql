
-- Table to track order status changes over time
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Store members can read history
CREATE POLICY "Members read order status history"
ON public.order_status_history
FOR SELECT
USING (is_store_member(store_id, auth.uid()));

-- Store admins/owners can insert history
CREATE POLICY "Admin/owner insert order status history"
ON public.order_status_history
FOR INSERT
WITH CHECK (is_store_admin_or_owner(store_id, auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON public.order_status_history(created_at);

-- Trigger to automatically log status changes on orders table
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, store_id, previous_status, new_status, note)
    VALUES (NEW.id, NEW.store_id, OLD.status::text, NEW.status::text, 'Changement automatique');
  END IF;
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO order_status_history (order_id, store_id, previous_status, new_status, note)
    VALUES (NEW.id, NEW.store_id, 'payment:' || OLD.payment_status::text, 'payment:' || NEW.payment_status::text, 'Changement paiement');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();
