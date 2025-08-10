-- Create new table for custom RSVP field definitions
CREATE TABLE public.rsvp_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_label TEXT NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'email', 'phone', 'number', 'select', 'radio', 'checkbox', 'toggle', 'date', 'time', 'datetime', 'file', 'rating', 'address')),
  is_required BOOLEAN DEFAULT false,
  field_options JSONB DEFAULT '{}',
  placeholder_text TEXT,
  validation_rules JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_rsvp_field_definitions_event_id ON public.rsvp_field_definitions(event_id);
CREATE INDEX idx_rsvp_field_definitions_display_order ON public.rsvp_field_definitions(event_id, display_order);

-- Add new columns to guests table for enhanced status tracking
ALTER TABLE public.guests 
ADD COLUMN status VARCHAR(20) DEFAULT 'not_viewed' CHECK (status IN ('not_viewed', 'viewed', 'accepted', 'submitted')),
ADD COLUMN custom_fields_submitted BOOLEAN DEFAULT false,
ADD COLUMN custom_fields_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_status_update TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to auto-update last_status_update
CREATE OR REPLACE FUNCTION public.update_guest_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_status_update = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guests_status_timestamp
  BEFORE UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_guest_status_timestamp();

-- Enable RLS on new table
ALTER TABLE public.rsvp_field_definitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rsvp_field_definitions
CREATE POLICY "Event hosts can manage their RSVP field definitions"
ON public.rsvp_field_definitions
FOR ALL
USING (
  event_id IN (
    SELECT id FROM public.events WHERE host_id = auth.uid()
  )
);

CREATE POLICY "Allow unauthenticated read access to RSVP field definitions for invitations"
ON public.rsvp_field_definitions
FOR SELECT
USING (true);

-- Create function to get custom fields for an event
CREATE OR REPLACE FUNCTION public.get_event_custom_rsvp_fields(event_uuid uuid)
RETURNS TABLE (
  id uuid,
  field_name varchar,
  field_label text,
  field_type varchar,
  is_required boolean,
  field_options jsonb,
  placeholder_text text,
  validation_rules jsonb,
  display_order integer
) 
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    rf.id,
    rf.field_name,
    rf.field_label,
    rf.field_type,
    rf.is_required,
    rf.field_options,
    rf.placeholder_text,
    rf.validation_rules,
    rf.display_order
  FROM public.rsvp_field_definitions rf
  WHERE rf.event_id = event_uuid
  ORDER BY rf.display_order ASC, rf.created_at ASC;
$$;