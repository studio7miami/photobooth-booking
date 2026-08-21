-- Dual-product bookings: studio sessions share the table with photobooth rentals.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS product text NOT NULL DEFAULT 'photobooth',
  ADD COLUMN IF NOT EXISTS resource text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS class_session_id text,
  ADD COLUMN IF NOT EXISTS client_notes text;

UPDATE public.bookings
SET resource = 'photobooth_kit'
WHERE resource IS NULL AND product = 'photobooth';

ALTER TABLE public.bookings
  ALTER COLUMN resource SET DEFAULT 'photobooth_kit';

CREATE INDEX IF NOT EXISTS idx_bookings_product_resource_date
  ON public.bookings (product, resource, event_date);

CREATE INDEX IF NOT EXISTS idx_bookings_class_session
  ON public.bookings (class_session_id)
  WHERE class_session_id IS NOT NULL;
