-- Fix existing guests who have rsvp_data but accepted = false
-- This addresses historical data inconsistency where guests submitted RSVP without being marked as accepted

UPDATE public.guests 
SET 
  accepted = true,
  accepted_at = CASE 
    WHEN accepted_at IS NULL THEN created_at 
    ELSE accepted_at 
  END
WHERE 
  rsvp_data IS NOT NULL 
  AND accepted = false;