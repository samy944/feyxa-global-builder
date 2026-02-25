ALTER TABLE public.profiles ADD COLUMN preferred_language text NOT NULL DEFAULT 'fr';

COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language: fr or en';