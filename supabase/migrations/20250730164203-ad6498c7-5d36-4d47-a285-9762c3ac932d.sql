-- Phase 1: Database Schema Simplification (Fixed with all triggers)

-- Remove deadline columns from events table (no deadline for now)
ALTER TABLE events DROP COLUMN IF EXISTS rsvp_deadline;
ALTER TABLE events DROP COLUMN IF EXISTS host_timezone;

-- Remove unnecessary response history table first (to avoid dependency issues)
DROP TABLE IF EXISTS guest_rsvp_responses;

-- Remove ALL associated triggers that might exist
DROP TRIGGER IF EXISTS update_guest_status_v2_trigger ON guests;
DROP TRIGGER IF EXISTS update_guest_status_trigger_v2 ON guests;
DROP TRIGGER IF EXISTS track_rsvp_response_trigger ON guests;
DROP TRIGGER IF EXISTS update_guest_status_trigger ON guests;
DROP TRIGGER IF EXISTS update_guest_status_timestamp_trigger ON guests;
DROP TRIGGER IF EXISTS update_rsvp_response_timestamp_trigger ON guests;
DROP TRIGGER IF EXISTS auto_generate_guest_id_trigger ON guests;
DROP TRIGGER IF EXISTS initialize_guest_event_access_trigger ON guests;

-- Drop the trigger functions that are no longer needed
DROP FUNCTION IF EXISTS update_guest_status_v2() CASCADE;
DROP FUNCTION IF EXISTS track_rsvp_response() CASCADE;
DROP FUNCTION IF EXISTS update_guest_status() CASCADE;
DROP FUNCTION IF EXISTS update_guest_status_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_rsvp_response_timestamp() CASCADE;

-- Drop guest_status enum completely (now safe since table is dropped)
DROP TYPE IF EXISTS guest_status CASCADE;

-- Remove complex status fields from guests table
ALTER TABLE guests DROP COLUMN IF EXISTS new_status;
ALTER TABLE guests DROP COLUMN IF EXISTS status; 
ALTER TABLE guests DROP COLUMN IF EXISTS custom_fields_submitted;
ALTER TABLE guests DROP COLUMN IF EXISTS custom_fields_submitted_at;
ALTER TABLE guests DROP COLUMN IF EXISTS last_status_update;
ALTER TABLE guests DROP COLUMN IF EXISTS latest_response_at;