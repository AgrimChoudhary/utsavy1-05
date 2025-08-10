-- Add a toggle to control guest-facing wish section visibility
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS wishes_enabled BOOLEAN NOT NULL DEFAULT true;