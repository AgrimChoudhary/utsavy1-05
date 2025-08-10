-- Add trigger to update response timestamp when RSVP data is modified
CREATE OR REPLACE FUNCTION public.update_rsvp_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update custom_fields_submitted_at when rsvp_data is modified
  IF (OLD.rsvp_data IS DISTINCT FROM NEW.rsvp_data) AND NEW.rsvp_data IS NOT NULL THEN
    NEW.custom_fields_submitted_at = now();
    NEW.custom_fields_submitted = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating RSVP response timestamp
DROP TRIGGER IF EXISTS update_rsvp_timestamp_trigger ON public.guests;
CREATE TRIGGER update_rsvp_timestamp_trigger
  BEFORE UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rsvp_response_timestamp();