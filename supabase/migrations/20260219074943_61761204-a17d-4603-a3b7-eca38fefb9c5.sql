
-- Add avg_rating and review_count to products for performance caching
ALTER TABLE public.products
ADD COLUMN avg_rating numeric DEFAULT 0,
ADD COLUMN review_count integer DEFAULT 0;

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  images jsonb DEFAULT '[]'::jsonb,
  is_verified boolean NOT NULL DEFAULT true,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, order_id, buyer_id)
);

-- Validation trigger for rating 1-5
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_rating_trigger
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- Function to check if user can review (order delivered + user is buyer)
CREATE OR REPLACE FUNCTION public.can_review_order(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.id = _order_id
      AND o.status = 'delivered'
      AND c.user_id = _user_id
  );
$$;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
CREATE POLICY "Public read approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true);

-- Store members can read all reviews for their store
CREATE POLICY "Store members read reviews"
ON public.reviews FOR SELECT
USING (is_store_member(store_id, auth.uid()));

-- Buyers can read their own reviews
CREATE POLICY "Buyers read own reviews"
ON public.reviews FOR SELECT
USING (buyer_id = auth.uid());

-- Authenticated users can insert reviews if eligible
CREATE POLICY "Buyers insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  buyer_id = auth.uid()
  AND can_review_order(order_id, auth.uid())
);

-- Buyers can update their own reviews
CREATE POLICY "Buyers update own reviews"
ON public.reviews FOR UPDATE
USING (buyer_id = auth.uid());

-- Marketplace admins can manage all reviews (approve/reject)
CREATE POLICY "Admins manage reviews"
ON public.reviews FOR ALL
USING (has_role(auth.uid(), 'marketplace_admin'));

-- Store owners can update approval status
CREATE POLICY "Store owners moderate reviews"
ON public.reviews FOR UPDATE
USING (is_store_admin_or_owner(store_id, auth.uid()));

-- Function to recalculate product avg_rating and review_count
CREATE OR REPLACE FUNCTION public.update_product_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _product_id uuid;
BEGIN
  _product_id := COALESCE(NEW.product_id, OLD.product_id);
  
  UPDATE products
  SET avg_rating = COALESCE((
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews
    WHERE product_id = _product_id AND is_approved = true
  ), 0),
  review_count = (
    SELECT COUNT(*)
    FROM reviews
    WHERE product_id = _product_id AND is_approved = true
  )
  WHERE id = _product_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_product_review_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_product_review_stats();

-- Updated_at trigger for reviews
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
