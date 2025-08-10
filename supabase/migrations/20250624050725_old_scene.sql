/*
  # Add RSVP data column to guests table

  1. Changes
    - Add `rsvp_data` JSONB column to the guests table to store detailed RSVP information
    
  2. Purpose
    - This allows storing structured RSVP form data when guests respond to invitations
    - Supports the new detailed RSVP form functionality
*/

-- Add rsvp_data column to guests table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guests' AND column_name = 'rsvp_data'
  ) THEN
    ALTER TABLE public.guests ADD COLUMN rsvp_data JSONB;
  END IF;
END $$;