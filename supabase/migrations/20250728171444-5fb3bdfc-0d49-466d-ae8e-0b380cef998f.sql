-- RSVP System V2 - Database Schema Migration
-- Phase 1: Core schema changes for new status system

-- Create new enum for guest status (4-stage system)
CREATE TYPE guest_status AS ENUM ('pending', 'viewed', 'accepted', 'submitted');

-- Add new columns to guests table
ALTER TABLE guests 
ADD COLUMN new_status guest_status DEFAULT 'pending',
ADD COLUMN latest_response_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create RSVP responses history table for tracking all responses
CREATE TABLE guest_rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  response_data JSONB,
  status guest_status NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_latest BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RSVP management columns to events table
ALTER TABLE events 
ADD COLUMN rsvp_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN host_timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
ADD COLUMN allow_rsvp_edit BOOLEAN DEFAULT true;

-- Performance indexes for fast queries
CREATE INDEX idx_guests_new_status ON guests(new_status);
CREATE INDEX idx_guests_event_status ON guests(event_id, new_status);
CREATE INDEX idx_guests_latest_response ON guests(event_id, latest_response_at DESC);
CREATE INDEX idx_rsvp_responses_latest ON guest_rsvp_responses(guest_id, is_latest) WHERE is_latest = true;
CREATE INDEX idx_rsvp_responses_event ON guest_rsvp_responses(event_id, submitted_at DESC);
CREATE INDEX idx_events_deadline ON events(rsvp_deadline) WHERE rsvp_deadline IS NOT NULL;

-- Migrate existing data to new status system
UPDATE guests SET 
  new_status = CASE 
    WHEN custom_fields_submitted = true THEN 'submitted'::guest_status
    WHEN accepted = true THEN 'accepted'::guest_status
    WHEN viewed = true THEN 'viewed'::guest_status
    ELSE 'pending'::guest_status
  END,
  latest_response_at = COALESCE(custom_fields_submitted_at, accepted_at, viewed_at, created_at);

-- Create trigger function for automatic status calculation
CREATE OR REPLACE FUNCTION update_guest_status_v2() 
RETURNS TRIGGER AS $$
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
RETURNS TRIGGER AS $$
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

-- Create triggers for automatic status updates
CREATE TRIGGER update_guest_status_trigger_v2
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_status_v2();

CREATE TRIGGER track_rsvp_response_trigger
  AFTER UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION track_rsvp_response();

-- Enable RLS for new table
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

-- Add comment for documentation
COMMENT ON TABLE guest_rsvp_responses IS 'Tracks all RSVP response history with latest flag for efficient queries';
COMMENT ON TYPE guest_status IS 'Four-stage RSVP status: pending -> viewed -> accepted -> submitted';