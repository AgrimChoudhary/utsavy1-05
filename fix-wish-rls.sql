-- Fix RLS policy for guest wish submission
-- This is the content from migration 20250810071750_29e151aa-2679-4206-8826-e0bc6bb9bcfa.sql

BEGIN;

-- Update SELECT policy for public viewing approved wishes
DROP POLICY IF EXISTS "Anyone can view approved wishes" ON public.wishes;
CREATE POLICY "Anyone can view approved wishes"
ON public.wishes
FOR SELECT
USING (
  is_approved = true
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = wishes.event_id AND COALESCE(e.wishes_enabled, true) = true
  )
);

-- Update INSERT policy for guests creating wishes
DROP POLICY IF EXISTS "Guests can create wishes" ON public.wishes;
CREATE POLICY "Guests can create wishes"
ON public.wishes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = wishes.guest_id AND g.event_id = wishes.event_id
  )
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = wishes.event_id AND COALESCE(e.wishes_enabled, true) = true
  )
);

COMMIT;

