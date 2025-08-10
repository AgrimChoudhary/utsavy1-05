
-- Insert the wedding invitation template into the templates table
INSERT INTO public.templates (
  name,
  component_name,
  fields,
  pages,
  thumbnail_url
) VALUES (
  'Traditional Wedding Invitation',
  'WeddingInvitation01Template',
  '{
    "bride_name": {
      "type": "text",
      "label": "Bride Name",
      "required": true,
      "placeholder": "Enter bride''s full name"
    },
    "groom_name": {
      "type": "text", 
      "label": "Groom Name",
      "required": true,
      "placeholder": "Enter groom''s full name"
    },
    "wedding_date": {
      "type": "date",
      "label": "Wedding Date",
      "required": true,
      "placeholder": "Select wedding date"
    },
    "wedding_time": {
      "type": "text",
      "label": "Wedding Time",
      "required": true,
      "placeholder": "e.g., 5:00 PM - 8:00 PM"
    },
    "couple_tagline": {
      "type": "text",
      "label": "Couple Tagline",
      "required": false,
      "placeholder": "e.g., Two hearts, one soul, forever together"
    },
    "venue_address": {
      "type": "text",
      "label": "Venue Address",
      "required": true,
      "placeholder": "Complete venue address"
    },
    "venue_map_link": {
      "type": "text",
      "label": "Venue Map Link",
      "required": false,
      "placeholder": "Google Maps link to venue"
    },
    "groom_first": {
      "type": "select",
      "label": "Name Order",
      "required": true,
      "options": ["Groom First", "Bride First"],
      "placeholder": "Choose name order preference"
    },
    "bride_family_title": {
      "type": "text",
      "label": "Bride Family Title",
      "required": true,
      "placeholder": "e.g., Sharma Family"
    },
    "bride_family_description": {
      "type": "textarea",
      "label": "Bride Family Description",
      "required": false,
      "placeholder": "Brief description of bride''s family"
    },
    "bride_family_address": {
      "type": "text",
      "label": "Bride Family Address",
      "required": false,
      "placeholder": "Bride family address"
    },
    "groom_family_title": {
      "type": "text",
      "label": "Groom Family Title", 
      "required": true,
      "placeholder": "e.g., Gupta Family"
    },
    "groom_family_description": {
      "type": "textarea",
      "label": "Groom Family Description",
      "required": false,
      "placeholder": "Brief description of groom''s family"
    },
    "groom_family_address": {
      "type": "text",
      "label": "Groom Family Address",
      "required": false,
      "placeholder": "Groom family address"
    },
    "contact_person_1_name": {
      "type": "text",
      "label": "Contact Person 1 Name",
      "required": true,
      "placeholder": "Primary contact person name"
    },
    "contact_person_1_number": {
      "type": "tel",
      "label": "Contact Person 1 Number",
      "required": true,
      "placeholder": "+1234567890"
    },
    "contact_person_2_name": {
      "type": "text",
      "label": "Contact Person 2 Name",
      "required": false,
      "placeholder": "Secondary contact person name"
    },
    "contact_person_2_number": {
      "type": "tel",
      "label": "Contact Person 2 Number",
      "required": false,
      "placeholder": "+1234567890"
    }
  }',
  '{
    "welcome": {
      "title": "Welcome",
      "component": "Welcome"
    },
    "invitation": {
      "title": "Invitation",
      "component": "Index"
    }
  }',
  '/lovable-uploads/5d906655-818b-462e-887e-0a392db20d48.png'
);
