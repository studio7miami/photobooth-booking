-- Photographers chosen from the team app (bookable users).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS shooter_id text,
  ADD COLUMN IF NOT EXISTS shooter_name text;
