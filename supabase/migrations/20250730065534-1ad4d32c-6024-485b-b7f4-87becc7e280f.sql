-- Fix: Add SECURITY DEFINER and proper search path to the trigger function
CREATE OR REPLACE FUNCTION public.update_guest_status_v2()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
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
$$;

-- Drop and recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS update_guest_status_v2_trigger ON public.guests;
CREATE TRIGGER update_guest_status_v2_trigger
  BEFORE INSERT OR UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_guest_status_v2();

-- Also ensure the RSVP tracking trigger is properly configured
DROP TRIGGER IF EXISTS track_rsvp_response_trigger ON public.guests;
CREATE TRIGGER track_rsvp_response_trigger
  AFTER INSERT OR UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.track_rsvp_response();