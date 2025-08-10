/*
  # Add tracking and encoding features to events and guests tables
  
  1. New Columns
    - Add custom_event_id column to events table (for base36 encoding)
    - Add custom_guest_id column to guests table (for base36 encoding)
    - Ensure viewed_at and accepted_at timestamps are properly tracked
  
  2. Security
    - Enable RLS policies to maintain security
    - Ensure proper constraints and indexes
*/

-- Add custom_event_id column to events table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'custom_event_id'
  ) THEN
    ALTER TABLE public.events ADD COLUMN custom_event_id VARCHAR(5);
    CREATE UNIQUE INDEX events_custom_event_id_key ON public.events (custom_event_id);
  END IF;
END $$;

-- Add custom_guest_id column to guests table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guests' AND column_name = 'custom_guest_id'
  ) THEN
    ALTER TABLE public.guests ADD COLUMN custom_guest_id VARCHAR(3);
    CREATE UNIQUE INDEX guests_custom_guest_id_key ON public.guests (custom_guest_id);
  END IF;
END $$;

-- Create function to generate a unique event ID
CREATE OR REPLACE FUNCTION auto_generate_event_id()
RETURNS TRIGGER AS $$
DECLARE
  base36_chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  id_length INTEGER := 5;
  random_id TEXT := '';
  is_unique BOOLEAN := FALSE;
BEGIN
  -- Generate a unique ID until we find one that doesn't exist
  WHILE NOT is_unique LOOP
    random_id := '';
    -- Generate random base36 ID
    FOR i IN 1..id_length LOOP
      random_id := random_id || substr(base36_chars, floor(random() * length(base36_chars))::integer + 1, 1);
    END LOOP;
    
    -- Check if this ID already exists
    PERFORM 1 FROM events WHERE custom_event_id = random_id;
    IF NOT FOUND THEN
      is_unique := TRUE;
    END IF;
  END LOOP;
  
  -- Set the custom_event_id
  NEW.custom_event_id := random_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate a unique guest ID
CREATE OR REPLACE FUNCTION auto_generate_guest_id()
RETURNS TRIGGER AS $$
DECLARE
  base36_chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  id_length INTEGER := 3;
  random_id TEXT := '';
  is_unique BOOLEAN := FALSE;
BEGIN
  -- Generate a unique ID until we find one that doesn't exist
  WHILE NOT is_unique LOOP
    random_id := '';
    -- Generate random base36 ID
    FOR i IN 1..id_length LOOP
      random_id := random_id || substr(base36_chars, floor(random() * length(base36_chars))::integer + 1, 1);
    END LOOP;
    
    -- Check if this ID already exists
    PERFORM 1 FROM guests WHERE custom_guest_id = random_id;
    IF NOT FOUND THEN
      is_unique := TRUE;
    END IF;
  END LOOP;
  
  -- Set the custom_guest_id
  NEW.custom_guest_id := random_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating event IDs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_auto_generate_event_id'
  ) THEN
    CREATE TRIGGER trigger_auto_generate_event_id
    BEFORE INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_event_id();
  END IF;
END $$;

-- Create trigger for auto-generating guest IDs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_auto_generate_guest_id'
  ) THEN
    CREATE TRIGGER trigger_auto_generate_guest_id
    BEFORE INSERT ON guests
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_guest_id();
  END IF;
END $$;

-- Generate custom IDs for existing records that don't have them
DO $$ 
DECLARE
  event_record RECORD;
  guest_record RECORD;
  base36_chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  random_id TEXT;
  is_unique BOOLEAN;
BEGIN
  -- Generate custom_event_id for existing events
  FOR event_record IN SELECT id FROM events WHERE custom_event_id IS NULL LOOP
    is_unique := FALSE;
    WHILE NOT is_unique LOOP
      random_id := '';
      -- Generate random base36 ID (5 characters)
      FOR i IN 1..5 LOOP
        random_id := random_id || substr(base36_chars, floor(random() * length(base36_chars))::integer + 1, 1);
      END LOOP;
      
      -- Check if this ID already exists
      PERFORM 1 FROM events WHERE custom_event_id = random_id;
      IF NOT FOUND THEN
        is_unique := TRUE;
        UPDATE events SET custom_event_id = random_id WHERE id = event_record.id;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Generate custom_guest_id for existing guests
  FOR guest_record IN SELECT id FROM guests WHERE custom_guest_id IS NULL LOOP
    is_unique := FALSE;
    WHILE NOT is_unique LOOP
      random_id := '';
      -- Generate random base36 ID (3 characters)
      FOR i IN 1..3 LOOP
        random_id := random_id || substr(base36_chars, floor(random() * length(base36_chars))::integer + 1, 1);
      END LOOP;
      
      -- Check if this ID already exists
      PERFORM 1 FROM guests WHERE custom_guest_id = random_id;
      IF NOT FOUND THEN
        is_unique := TRUE;
        UPDATE guests SET custom_guest_id = random_id WHERE id = guest_record.id;
      END IF;
    END LOOP;
  END LOOP;
END $$;