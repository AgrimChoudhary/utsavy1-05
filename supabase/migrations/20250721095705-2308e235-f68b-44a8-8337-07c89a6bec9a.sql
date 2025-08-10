-- Update guest statuses based on their current state
UPDATE guests 
SET status = CASE 
  WHEN custom_fields_submitted = true THEN 'submitted'
  WHEN accepted = true THEN 'accepted'
  WHEN viewed = true THEN 'viewed'
  ELSE 'not_viewed'
END
WHERE event_id = '68a7834c-fd88-49a3-a06a-8755c53825ac';

-- Create a trigger to automatically update guest status when related fields change
CREATE OR REPLACE FUNCTION update_guest_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on the current state
  IF NEW.custom_fields_submitted = true THEN
    NEW.status = 'submitted';
  ELSIF NEW.accepted = true THEN
    NEW.status = 'accepted';
  ELSIF NEW.viewed = true THEN
    NEW.status = 'viewed';
  ELSE
    NEW.status = 'not_viewed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and create it fresh
DROP TRIGGER IF EXISTS trigger_update_guest_status ON guests;
CREATE TRIGGER trigger_update_guest_status
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_status();