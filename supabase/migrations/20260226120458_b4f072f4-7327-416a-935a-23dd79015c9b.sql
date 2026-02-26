
-- Create direct_messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_dm_order_id ON public.direct_messages(order_id);
CREATE INDEX idx_dm_store_id ON public.direct_messages(store_id);
CREATE INDEX idx_dm_sender_id ON public.direct_messages(sender_id);
CREATE INDEX idx_dm_created_at ON public.direct_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Policy: participants can read messages (buyer via customer.user_id or store member)
CREATE POLICY "Participants can read messages"
ON public.direct_messages
FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid()
  OR is_store_member(store_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.id = direct_messages.order_id AND c.user_id = auth.uid()
  )
);

-- Policy: authenticated users can insert if they are a participant
CREATE POLICY "Participants can send messages"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    is_store_member(store_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE o.id = order_id AND c.user_id = auth.uid()
    )
  )
);

-- Policy: receiver can mark as read
CREATE POLICY "Participants can mark as read"
ON public.direct_messages
FOR UPDATE
TO authenticated
USING (
  is_store_member(store_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.id = direct_messages.order_id AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  is_store_member(store_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.id = direct_messages.order_id AND c.user_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
