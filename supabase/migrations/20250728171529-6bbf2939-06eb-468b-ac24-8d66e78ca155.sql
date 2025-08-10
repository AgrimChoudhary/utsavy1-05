-- RSVP System V2 - Fixed Database Schema Migration
-- First, remove the old check constraint that's causing issues

-- Drop the old status check constraint
ALTER TABLE guests DROP CONSTRAINT IF EXISTS guests_status_check;

-- Create new enum for guest status (4-stage system)
CREATE TYPE guest_status AS ENUM ('pending', 'viewed', 'accepted', 'submitted');

-- Add new columns to guests table
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS new_status guest_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS latest_response_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create RSVP responses history table for tracking all responses
CREATE TABLE IF NOT EXISTS guest_rsvp_responses (
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
ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS host_timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
ADD COLUMN IF NOT EXISTS allow_rsvp_edit BOOLEAN DEFAULT true;

-- Performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_guests_new_status ON guests(new_status);
CREATE INDEX IF NOT EXISTS idx_guests_event_status ON guests(event_id, new_status);
CREATE INDEX IF NOT EXISTS idx_guests_latest_response ON guests(event_id, latest_response_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_latest ON guest_rsvp_responses(guest_id, is_latest) WHERE is_latest = true;
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_event ON guest_rsvp_responses(event_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_deadline ON events(rsvp_deadline) WHERE rsvp_deadline IS NOT NULL;