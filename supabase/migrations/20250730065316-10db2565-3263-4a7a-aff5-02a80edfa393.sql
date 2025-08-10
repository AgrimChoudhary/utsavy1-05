-- Phase 1: Data Cleanup Migration
-- Fix all existing guest records to have correct new_status based on actual data state

UPDATE public.guests 
SET new_status = CASE
  -- If custom fields submitted and has rsvp_data, should be 'submitted'
  WHEN custom_fields_submitted = true AND rsvp_data IS NOT NULL THEN 'submitted'::guest_status
  -- Else if accepted, should be 'accepted'  
  WHEN accepted = true THEN 'accepted'::guest_status
  -- Else if viewed, should be 'viewed'
  WHEN viewed = true THEN 'viewed'::guest_status
  -- Else should be 'pending'
  ELSE 'pending'::guest_status
END,
latest_response_at = COALESCE(
  custom_fields_submitted_at,
  accepted_at, 
  viewed_at,
  created_at
)
WHERE new_status != CASE
  WHEN custom_fields_submitted = true AND rsvp_data IS NOT NULL THEN 'submitted'::guest_status
  WHEN accepted = true THEN 'accepted'::guest_status
  WHEN viewed = true THEN 'viewed'::guest_status
  ELSE 'pending'::guest_status
END;

-- Phase 2: Create/Update database trigger for proper 4-stage flow handling
CREATE OR REPLACE FUNCTION public.update_guest_status_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Update new_status based on the actual data state
  IF NEW.custom_fields_submitted = true AND NEW.rsvp_data IS NOT NULL THEN
    NEW.new_status = 'submitted'::guest_status;
  ELSIF NEW.accepted = true THEN
    NEW.new_status = 'accepted'::guest_status;
  ELSIF NEW.viewed = true THEN
    NEW.new_status = 'viewed'::guest_status;
  ELSE
    NEW.new_status = 'pending'::guest_status;
  END IF;

  -- Update latest_response_at timestamp
  NEW.latest_response_at = COALESCE(
    NEW.custom_fields_submitted_at,
    NEW.accepted_at,
    NEW.viewed_at,
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_guest_status_v2_trigger ON public.guests;
CREATE TRIGGER update_guest_status_v2_trigger
  BEFORE INSERT OR UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_guest_status_v2();