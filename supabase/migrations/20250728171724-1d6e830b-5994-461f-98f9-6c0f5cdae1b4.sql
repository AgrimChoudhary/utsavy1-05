-- RSVP System V2 - Complete the migration with security fixes

-- Migrate existing data to new status system
UPDATE guests SET 
  new_status = CASE 
    WHEN custom_fields_submitted = true THEN 'submitted'::guest_status
    WHEN accepted = true THEN 'accepted'::guest_status
    WHEN viewed = true THEN 'viewed'::guest_status
    ELSE 'pending'::guest_status
  END,
  latest_response_at = COALESCE(custom_fields_submitted_at, accepted_at, viewed_at, created_at);

-- Create trigger functions with security definer and proper search path
CREATE OR REPLACE FUNCTION update_guest_status_v2() 
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Update status based on the current state (4-stage logic)
  IF NEW.rsvp_data IS NOT NULL AND 
     EXISTS(SELECT 1 FROM guest_rsvp_responses WHERE guest_id = NEW.id AND is_latest = true) THEN
    NEW.new_status = 'submitted';
  ELSIF NEW.accepted = true THEN
    NEW.new_status = 'accepted';
  ELSIF NEW.viewed = true THEN
    NEW.new_status = 'viewed';
  ELSE
    NEW.new_status = 'pending';
  END IF;
  
  NEW.latest_response_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for RSVP response history tracking
CREATE OR REPLACE FUNCTION track_rsvp_response() 
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Mark previous responses as not latest
  UPDATE guest_rsvp_responses 
  SET is_latest = false 
  WHERE guest_id = NEW.id AND is_latest = true;
  
  -- Insert new response if rsvp_data changed and is not null
  IF OLD.rsvp_data IS DISTINCT FROM NEW.rsvp_data AND NEW.rsvp_data IS NOT NULL THEN
    INSERT INTO guest_rsvp_responses (guest_id, event_id, response_data, status)
    VALUES (NEW.id, NEW.event_id, NEW.rsvp_data, NEW.new_status);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_guest_status_trigger_v2 ON guests;
DROP TRIGGER IF EXISTS track_rsvp_response_trigger ON guests;

-- Create triggers for automatic status updates
CREATE TRIGGER update_guest_status_trigger_v2
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_status_v2();

CREATE TRIGGER track_rsvp_response_trigger
  AFTER UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION track_rsvp_response();

-- Enable RLS for new table (CRITICAL SECURITY FIX)
ALTER TABLE guest_rsvp_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for guest_rsvp_responses table
CREATE POLICY "Event hosts can manage RSVP responses" 
ON guest_rsvp_responses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = guest_rsvp_responses.event_id 
    AND events.host_id = auth.uid()
  )
);

CREATE POLICY "Allow unauthenticated access to RSVP responses for invitations" 
ON guest_rsvp_responses 
FOR SELECT 
USING (true);

-- Add helpful comments for documentation
COMMENT ON TABLE guest_rsvp_responses IS 'Tracks all RSVP response history with latest flag for efficient queries';
COMMENT ON TYPE guest_status IS 'Four-stage RSVP status: pending -> viewed -> accepted -> submitted';