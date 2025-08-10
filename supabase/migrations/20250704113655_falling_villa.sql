/*
  # Add guest_event_access table

  1. New Tables
    - `guest_event_access` - Tracks which events a guest can access
      - `id` (uuid, primary key)
      - `guest_id` (uuid, foreign key to guests)
      - `event_detail_id` (text, references the index in the events array)
      - `event_id` (uuid, foreign key to events)
      - `can_access` (boolean, default true)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `guest_event_access` table
    - Add policies for guests to read their own access settings
    - Add policies for hosts to manage guest event access
*/

-- Create guest_event_access table
CREATE TABLE IF NOT EXISTS guest_event_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_detail_id text NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  can_access boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guest_id, event_detail_id, event_id)
);

-- Enable Row Level Security
ALTER TABLE guest_event_access ENABLE ROW LEVEL SECURITY;

-- Policies for guest_event_access
-- Guests can read their own access settings
CREATE POLICY "Guests can read their own access settings"
  ON guest_event_access
  FOR SELECT
  TO public
  USING (
    guest_id IN (
      SELECT id FROM guests WHERE user_id = uid()
    )
  );

-- Hosts can manage guest event access
CREATE POLICY "Hosts can manage guest event access"
  ON guest_event_access
  FOR ALL
  TO public
  USING (
    event_id IN (
      SELECT id FROM events WHERE host_id = uid()
    )
  );

-- Create function to initialize guest event access when a guest is created
CREATE OR REPLACE FUNCTION initialize_guest_event_access()
RETURNS TRIGGER AS $$
DECLARE
  event_details JSONB;
  event_count INTEGER;
  i INTEGER;
BEGIN
  -- Get the event details
  SELECT details INTO event_details FROM events WHERE id = NEW.event_id;
  
  -- Check if the event has an events array
  IF event_details ? 'events' AND jsonb_typeof(event_details->'events') = 'array' THEN
    -- Get the number of events
    event_count := jsonb_array_length(event_details->'events');
    
    -- Create access records for each event
    FOR i IN 0..(event_count-1) LOOP
      INSERT INTO guest_event_access (guest_id, event_detail_id, event_id, can_access)
      VALUES (NEW.id, i::text, NEW.event_id, TRUE)
      ON CONFLICT (guest_id, event_detail_id, event_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize guest event access
CREATE TRIGGER trigger_initialize_guest_event_access
AFTER INSERT ON guests
FOR EACH ROW
EXECUTE FUNCTION initialize_guest_event_access();

-- Create function to update guest event access when event details change
CREATE OR REPLACE FUNCTION update_guest_event_access()
RETURNS TRIGGER AS $$
DECLARE
  guest_record RECORD;
  event_count INTEGER;
  i INTEGER;
BEGIN
  -- Get the number of events in the new details
  event_count := jsonb_array_length(NEW.details->'events');
  
  -- For each guest of this event
  FOR guest_record IN SELECT id FROM guests WHERE event_id = NEW.id LOOP
    -- Create access records for each event
    FOR i IN 0..(event_count-1) LOOP
      INSERT INTO guest_event_access (guest_id, event_detail_id, event_id, can_access)
      VALUES (guest_record.id, i::text, NEW.id, TRUE)
      ON CONFLICT (guest_id, event_detail_id, event_id) DO NOTHING;
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update guest event access when event details change
CREATE TRIGGER trigger_update_guest_event_access
AFTER UPDATE OF details ON events
FOR EACH ROW
WHEN (
  (NEW.details ? 'events' AND jsonb_typeof(NEW.details->'events') = 'array') AND
  (NOT (OLD.details ? 'events') OR jsonb_typeof(OLD.details->'events') <> 'array' OR 
   jsonb_array_length(NEW.details->'events') <> jsonb_array_length(OLD.details->'events'))
)
EXECUTE FUNCTION update_guest_event_access();

-- Create function to check if a user can view an event
CREATE OR REPLACE FUNCTION user_can_view_event(event_id uuid)
RETURNS boolean AS $$
DECLARE
  is_host boolean;
  is_guest boolean;
BEGIN
  -- Check if the user is the host of the event
  SELECT EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND host_id = uid()
  ) INTO is_host;
  
  IF is_host THEN
    RETURN TRUE;
  END IF;
  
  -- Check if the user is a guest of the event
  SELECT EXISTS (
    SELECT 1 FROM guests 
    WHERE event_id = event_id AND user_id = uid()
  ) INTO is_guest;
  
  RETURN is_guest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;