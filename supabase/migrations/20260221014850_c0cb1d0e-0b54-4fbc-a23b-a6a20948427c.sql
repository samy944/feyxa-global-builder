-- Indexes for trends queries performance
CREATE INDEX IF NOT EXISTS idx_orders_store_created ON public.orders (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_product_created ON public.order_items (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_marketplace_published ON public.products (is_marketplace_published, marketplace_category_id) WHERE is_marketplace_published = true;
CREATE INDEX IF NOT EXISTS idx_products_store_published ON public.products (store_id, is_published) WHERE is_published = true;