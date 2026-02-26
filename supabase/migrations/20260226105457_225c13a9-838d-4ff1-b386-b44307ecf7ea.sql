
-- Add video_url and low_stock_alert_enabled to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_alert_enabled BOOLEAN NOT NULL DEFAULT false;
