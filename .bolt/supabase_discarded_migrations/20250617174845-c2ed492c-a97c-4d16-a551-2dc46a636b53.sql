
-- Step 1: Add new fields to templates table for external template support
ALTER TABLE public.templates 
ADD COLUMN template_type text DEFAULT 'internal' CHECK (template_type IN ('internal', 'external')),
ADD COLUMN external_url text;

-- Step 2: Insert the utsavy2.vercel.app template entry
INSERT INTO public.templates (
  name,
  component_name,
  template_type,
  external_url,
  thumbnail_url,
  fields,
  pages
) VALUES (
  'Royal Wedding Invitation - External',
  'ExternalIframeTemplate',
  'external',
  'https://utsavy2.vercel.app',
  '/lovable-uploads/762354ab-cff9-4c6a-9800-94eeefc3c43c.png',
  '{
    "bride_name": {"type": "text", "label": "Bride Name", "required": true},
    "groom_name": {"type": "text", "label": "Groom Name", "required": true},
    "wedding_date": {"type": "date", "label": "Wedding Date", "required": true},
    "wedding_time": {"type": "time", "label": "Wedding Time", "required": true},
    "venue": {"type": "text", "label": "Venue Name", "required": true},
    "address": {"type": "text", "label": "Venue Address", "required": true},
    "map_link": {"type": "text", "label": "Map Link", "required": false},
    "events": {"type": "array", "label": "Event Timeline", "required": false},
    "bride_family": {"type": "object", "label": "Bride Family", "required": false},
    "groom_family": {"type": "object", "label": "Groom Family", "required": false},
    "photos": {"type": "array", "label": "Photos", "required": false},
    "contacts": {"type": "array", "label": "Contact Information", "required": false},
    "custom_message": {"type": "text", "label": "Custom Message", "required": false}
  }',
  '{
    "welcome": {"title": "Welcome Page", "component": "WelcomePage"},
    "invitation": {"title": "Main Invitation", "component": "InvitationPage"}
  }'
);
