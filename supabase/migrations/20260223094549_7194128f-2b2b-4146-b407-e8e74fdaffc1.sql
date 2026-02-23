
-- Enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('open', 'pending_seller', 'pending_customer', 'resolved', 'escalated');

-- Enum for ticket priority
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  order_id UUID REFERENCES public.orders(id),
  product_id UUID REFERENCES public.products(id),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  subject TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ticket messages table
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- Indexes
CREATE INDEX idx_tickets_store_id ON public.support_tickets(store_id);
CREATE INDEX idx_tickets_buyer_id ON public.support_tickets(buyer_id);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);

-- Updated_at trigger for tickets
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS: support_tickets
-- Buyers can see their own tickets
CREATE POLICY "Buyers read own tickets"
  ON public.support_tickets FOR SELECT
  USING (buyer_id = auth.uid());

-- Store members can see tickets for their store
CREATE POLICY "Store members read store tickets"
  ON public.support_tickets FOR SELECT
  USING (is_store_member(store_id, auth.uid()));

-- Marketplace admins can see all tickets
CREATE POLICY "Marketplace admins read all tickets"
  ON public.support_tickets FOR SELECT
  USING (has_role(auth.uid(), 'marketplace_admin'));

-- Buyers can create tickets
CREATE POLICY "Buyers create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Store members can update ticket status
CREATE POLICY "Store members update tickets"
  ON public.support_tickets FOR UPDATE
  USING (is_store_member(store_id, auth.uid()));

-- Buyers can update their tickets (e.g. close)
CREATE POLICY "Buyers update own tickets"
  ON public.support_tickets FOR UPDATE
  USING (buyer_id = auth.uid());

-- Marketplace admins can update all tickets
CREATE POLICY "Marketplace admins update tickets"
  ON public.support_tickets FOR UPDATE
  USING (has_role(auth.uid(), 'marketplace_admin'));

-- RLS: ticket_messages
-- Helper function to get ticket buyer/seller
CREATE OR REPLACE FUNCTION public.can_access_ticket(_ticket_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = _ticket_id
    AND (buyer_id = _user_id OR is_store_member(store_id, _user_id) OR has_role(_user_id, 'marketplace_admin'))
  );
$$;

-- Anyone with access to ticket can read messages
CREATE POLICY "Ticket participants read messages"
  ON public.ticket_messages FOR SELECT
  USING (can_access_ticket(ticket_id, auth.uid()));

-- Anyone with access to ticket can send messages
CREATE POLICY "Ticket participants send messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND can_access_ticket(ticket_id, auth.uid()));
