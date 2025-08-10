
-- Add rsvp_config column to events table to store RSVP settings
ALTER TABLE public.events
ADD COLUMN rsvp_config jsonb;
