-- Phase 1: Database Schema Simplification

-- Remove deadline columns from events table (no deadline for now)
ALTER TABLE events DROP COLUMN IF EXISTS rsvp_deadline;
ALTER TABLE events DROP COLUMN IF EXISTS host_timezone;

-- Remove complex status fields from guests table
ALTER TABLE guests DROP COLUMN IF EXISTS new_status;
ALTER TABLE guests DROP COLUMN IF EXISTS status; 
ALTER TABLE guests DROP COLUMN IF EXISTS custom_fields_submitted;
ALTER TABLE guests DROP COLUMN IF EXISTS custom_fields_submitted_at;
ALTER TABLE guests DROP COLUMN IF EXISTS last_status_update;
ALTER TABLE guests DROP COLUMN IF EXISTS latest_response_at;

-- Drop guest_status enum completely
DROP TYPE IF EXISTS guest_status;

-- Remove unnecessary response history table
DROP TABLE IF EXISTS guest_rsvp_responses;

-- Remove associated triggers that are no longer needed
DROP TRIGGER IF EXISTS update_guest_status_v2_trigger ON guests;
DROP TRIGGER IF EXISTS track_rsvp_response_trigger ON guests;
DROP TRIGGER IF EXISTS update_guest_status_trigger ON guests;
DROP TRIGGER IF EXISTS update_guest_status_timestamp_trigger ON guests;
DROP TRIGGER IF EXISTS update_rsvp_response_timestamp_trigger ON guests;

-- Drop the trigger functions that are no longer needed
DROP FUNCTION IF EXISTS update_guest_status_v2();
DROP FUNCTION IF EXISTS track_rsvp_response();
DROP FUNCTION IF EXISTS update_guest_status();
DROP FUNCTION IF EXISTS update_guest_status_timestamp();
DROP FUNCTION IF EXISTS update_rsvp_response_timestamp();