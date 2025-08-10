-- Update guest status logic to remove decline functionality
-- Update the status field to use the new values
UPDATE guests 
SET status = CASE 
  WHEN status = 'not_viewed' THEN 'pending'
  WHEN status = 'declined' THEN 'viewed' -- Convert declined back to viewed
  ELSE status
END;

-- Update the update_guest_status function to reflect new status logic
CREATE OR REPLACE FUNCTION public.update_guest_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update status based on the current state
  IF NEW.custom_fields_submitted = true THEN
    NEW.status = 'submitted';
  ELSIF NEW.accepted = true THEN
    NEW.status = 'accepted';
  ELSIF NEW.viewed = true THEN
    NEW.status = 'viewed';
  ELSE
    NEW.status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$function$;