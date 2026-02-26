-- Add full_name and phone to saved_addresses for the address book
ALTER TABLE public.saved_addresses
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text;
