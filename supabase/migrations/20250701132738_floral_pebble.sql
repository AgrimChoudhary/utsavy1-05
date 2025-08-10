/*
  # Add event-wise guest management functionality
  
  1. New Tables
    - Create guest_event_access table to track which guests can access which events
  
  2. Changes
    - Add functions and triggers to manage guest event access
    - Add RLS policies for the new table
    
  3. Purpose
    - Allow hosts to control which guests can see which events
    - Provide granular control over invitation content per guest
*/

-- Create guest_event_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.guest_event_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  event_detail_id TEXT NOT NULL, -- This will store the index or ID of the event in the events array
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  can_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique constraint for guest + event detail combination
  UNIQUE(guest_id, event_detail_id, event_id)
);

-- Enable RLS on the new table
ALTER TABLE public.guest_event_access ENABLE ROW LEVEL SECURITY;

-- Create policy to allow event hosts to manage guest event access
CREATE POLICY "Hosts can manage guest event access"
  ON public.guest_event_access
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE host_id = auth.uid()
    )
  );

-- Create policy to allow guests to read their own access settings
CREATE POLICY "Guests can read their own access settings"
  ON public.guest_event_access
  FOR SELECT
  USING (
    guest_id IN (
      SELECT id FROM public.guests WHERE user_id = auth.uid()
    )
  );

-- Function to initialize default access for all events when a new guest is added
CREATE OR REPLACE FUNCTION initialize_guest_event_access()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
  event_details JSONB;
  event_detail JSONB;
  event_index INTEGER;
BEGIN
  -- Get the event details from the events table
  SELECT details INTO event_details
  FROM public.events
  WHERE id = NEW.event_id;
  
  -- If the event has an events array in its details
  IF event_details ? 'events' AND jsonb_typeof(event_details->'events') = 'array' THEN
    -- Loop through each event in the array
    FOR event_index IN 0..jsonb_array_length(event_details->'events')-1 LOOP
      -- Insert a record granting access by default
      INSERT INTO public.guest_event_access (
        guest_id,
        event_detail_id,
        event_id,
        can_access
      ) VALUES (
        NEW.id,
        event_index::TEXT,
        NEW.event_id,
        true
      )
      ON CONFLICT (guest_id, event_detail_id, event_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize guest event access when a new guest is added
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_initialize_guest_event_access'
  ) THEN
    CREATE TRIGGER trigger_initialize_guest_event_access
    AFTER INSERT ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION initialize_guest_event_access();
  END IF;
END $$;

-- Function to update guest event access when event details are updated
CREATE OR REPLACE FUNCTION update_guest_event_access()
RETURNS TRIGGER AS $$
DECLARE
  guest_record RECORD;
  old_events_count INTEGER;
  new_events_count INTEGER;
  event_index INTEGER;
BEGIN
  -- Get the old and new event counts
  old_events_count := CASE 
    WHEN OLD.details ? 'events' AND jsonb_typeof(OLD.details->'events') = 'array' 
    THEN jsonb_array_length(OLD.details->'events') 
    ELSE 0 
  END;
  
  new_events_count := CASE 
    WHEN NEW.details ? 'events' AND jsonb_typeof(NEW.details->'events') = 'array' 
    THEN jsonb_array_length(NEW.details->'events') 
    ELSE 0 
  END;
  
  -- If events were added
  IF new_events_count > old_events_count THEN
    -- For each guest of this event
    FOR guest_record IN SELECT id FROM public.guests WHERE event_id = NEW.id LOOP
      -- For each new event
      FOR event_index IN old_events_count..new_events_count-1 LOOP
        -- Insert a record granting access by default
        INSERT INTO public.guest_event_access (
          guest_id,
          event_detail_id,
          event_id,
          can_access
        ) VALUES (
          guest_record.id,
          event_index::TEXT,
          NEW.id,
          true
        )
        ON CONFLICT (guest_id, event_detail_id, event_id) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update guest event access when event details are updated
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_guest_event_access'
  ) THEN
    CREATE TRIGGER trigger_update_guest_event_access
    AFTER UPDATE OF details ON public.events
    FOR EACH ROW
    WHEN (
      (NEW.details ? 'events' AND jsonb_typeof(NEW.details->'events') = 'array') AND
      (
        (NOT (OLD.details ? 'events')) OR
        (jsonb_typeof(OLD.details->'events') != 'array') OR
        (jsonb_array_length(NEW.details->'events') != jsonb_array_length(OLD.details->'events'))
      )
    )
    EXECUTE FUNCTION update_guest_event_access();
  END IF;
END $$;

-- Add function to get filtered events for a specific guest
CREATE OR REPLACE FUNCTION get_guest_visible_events(p_guest_id UUID)
RETURNS JSONB AS $$
DECLARE
  guest_record RECORD;
  event_record RECORD;
  event_details JSONB;
  filtered_events JSONB := '[]'::JSONB;
  event_index INTEGER;
BEGIN
  -- Get the guest and associated event
  SELECT g.*, e.details INTO guest_record
  FROM public.guests g
  JOIN public.events e ON g.event_id = e.id
  WHERE g.id = p_guest_id;
  
  -- If guest not found or event has no events array, return empty array
  IF guest_record IS NULL OR 
     NOT (guest_record.details ? 'events') OR 
     jsonb_typeof(guest_record.details->'events') != 'array' THEN
    RETURN filtered_events;
  END IF;
  
  -- Loop through each event in the array
  FOR event_index IN 0..jsonb_array_length(guest_record.details->'events')-1 LOOP
    -- Check if guest has access to this event
    IF EXISTS (
      SELECT 1 FROM public.guest_event_access
      WHERE guest_id = p_guest_id
      AND event_detail_id = event_index::TEXT
      AND event_id = guest_record.event_id
      AND can_access = true
    ) THEN
      -- Add this event to the filtered list
      filtered_events := filtered_events || (guest_record.details->'events'->event_index);
    END IF;
  END LOOP;
  
  RETURN filtered_events;
END;
$$ LANGUAGE plpgsql;