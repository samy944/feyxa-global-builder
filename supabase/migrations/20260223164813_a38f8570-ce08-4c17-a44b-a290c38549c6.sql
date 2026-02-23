
-- 1) Countries table
CREATE TABLE public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  currency_code text NOT NULL DEFAULT 'XOF',
  flag_emoji text DEFAULT '🌍',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active countries" ON public.countries FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage countries" ON public.countries FOR ALL USING (has_role(auth.uid(), 'marketplace_admin'));

-- Seed initial countries
INSERT INTO public.countries (code, name, currency_code, flag_emoji, sort_order) VALUES
  ('BJ', 'Bénin', 'XOF', '🇧🇯', 1),
  ('SN', 'Sénégal', 'XOF', '🇸🇳', 2),
  ('CI', 'Côte d''Ivoire', 'XOF', '🇨🇮', 3),
  ('TG', 'Togo', 'XOF', '🇹🇬', 4),
  ('BF', 'Burkina Faso', 'XOF', '🇧🇫', 5),
  ('ML', 'Mali', 'XOF', '🇲🇱', 6),
  ('NE', 'Niger', 'XOF', '🇳🇪', 7),
  ('GN', 'Guinée', 'GNF', '🇬🇳', 8),
  ('CM', 'Cameroun', 'XAF', '🇨🇲', 9),
  ('GA', 'Gabon', 'XAF', '🇬🇦', 10),
  ('CG', 'Congo', 'XAF', '🇨🇬', 11),
  ('CD', 'RD Congo', 'CDF', '🇨🇩', 12),
  ('NG', 'Nigeria', 'NGN', '🇳🇬', 13),
  ('GH', 'Ghana', 'GHS', '🇬🇭', 14),
  ('MA', 'Maroc', 'MAD', '🇲🇦', 15),
  ('FR', 'France', 'EUR', '🇫🇷', 16);

-- 2) Cities table
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cities_country ON public.cities(country_id);
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active cities" ON public.cities FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage cities" ON public.cities FOR ALL USING (has_role(auth.uid(), 'marketplace_admin'));

-- Seed cities for Bénin
INSERT INTO public.cities (country_id, name, sort_order)
SELECT c.id, city.name, city.ord
FROM public.countries c,
(VALUES ('Cotonou',1),('Porto-Novo',2),('Parakou',3),('Abomey-Calavi',4),('Bohicon',5),('Natitingou',6)) AS city(name,ord)
WHERE c.code = 'BJ';

-- Seed cities for Sénégal
INSERT INTO public.cities (country_id, name, sort_order)
SELECT c.id, city.name, city.ord
FROM public.countries c,
(VALUES ('Dakar',1),('Thiès',2),('Saint-Louis',3),('Kaolack',4),('Ziguinchor',5)) AS city(name,ord)
WHERE c.code = 'SN';

-- Seed cities for Côte d'Ivoire
INSERT INTO public.cities (country_id, name, sort_order)
SELECT c.id, city.name, city.ord
FROM public.countries c,
(VALUES ('Abidjan',1),('Bouaké',2),('Yamoussoukro',3),('San-Pédro',4),('Daloa',5)) AS city(name,ord)
WHERE c.code = 'CI';

-- Seed cities for Togo
INSERT INTO public.cities (country_id, name, sort_order)
SELECT c.id, city.name, city.ord
FROM public.countries c,
(VALUES ('Lomé',1),('Kara',2),('Sokodé',3)) AS city(name,ord)
WHERE c.code = 'TG';

-- Seed cities for Nigeria
INSERT INTO public.cities (country_id, name, sort_order)
SELECT c.id, city.name, city.ord
FROM public.countries c,
(VALUES ('Lagos',1),('Abuja',2),('Kano',3),('Ibadan',4),('Port Harcourt',5)) AS city(name,ord)
WHERE c.code = 'NG';

-- Seed cities for Cameroun
INSERT INTO public.cities (country_id, name, sort_order)
SELECT c.id, city.name, city.ord
FROM public.countries c,
(VALUES ('Douala',1),('Yaoundé',2),('Bafoussam',3),('Garoua',4)) AS city(name,ord)
WHERE c.code = 'CM';

-- 3) Product listings (localized per country)
CREATE TABLE public.product_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  currency_code text NOT NULL DEFAULT 'XOF',
  stock_qty integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  shipping_profile_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, country_id)
);
CREATE INDEX idx_product_listings_country ON public.product_listings(country_id, is_available);
CREATE INDEX idx_product_listings_product ON public.product_listings(product_id);
ALTER TABLE public.product_listings ENABLE ROW LEVEL SECURITY;

-- Public can read available listings
CREATE POLICY "Public read available listings" ON public.product_listings
  FOR SELECT USING (is_available = true);

-- Store members can manage their own product listings
CREATE POLICY "Store members manage listings" ON public.product_listings
  FOR ALL USING (is_store_member(get_store_id_for_product(product_id), auth.uid()))
  WITH CHECK (is_store_member(get_store_id_for_product(product_id), auth.uid()));

-- 4) Add location preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS selected_country_id uuid REFERENCES public.countries(id),
  ADD COLUMN IF NOT EXISTS selected_city_id uuid REFERENCES public.cities(id);

-- Trigger for updated_at on product_listings
CREATE TRIGGER update_product_listings_updated_at
  BEFORE UPDATE ON public.product_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
