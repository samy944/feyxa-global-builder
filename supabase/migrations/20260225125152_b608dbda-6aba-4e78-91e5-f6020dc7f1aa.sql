
-- Add email to customers if not already present (it already exists)
-- Add tracking_token to orders for secure direct-link access
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;

-- Create unique index on tracking_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders (tracking_token) WHERE tracking_token IS NOT NULL;

-- Index for email-based lookup
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email) WHERE customer_email IS NOT NULL;
