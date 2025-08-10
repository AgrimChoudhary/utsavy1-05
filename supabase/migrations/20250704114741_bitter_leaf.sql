/*
  # Add new external wedding template

  1. New Template
    - Adds a new external wedding template from utsavy.vercel.app
    - Configures template fields and metadata
    - Sets template type to 'external'
  
  2. Template Configuration
    - Adds comprehensive field structure for the template
    - Includes support for extended family information
    - Supports multiple events with descriptions
    - Includes photo gallery with titles and descriptions
*/

-- Add the new external template
INSERT INTO templates (
  name, 
  component_name, 
  template_type, 
  external_url, 
  thumbnail_url,
  fields,
  pages
)
VALUES (
  'Royal Indian Wedding', 
  'RoyalWeddingTemplate', 
  'external', 
  'https://utsavy.vercel.app', 
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
  jsonb_build_object(
    'couple', jsonb_build_object(
      'bride_name', jsonb_build_object('type', 'text', 'label', 'Bride Name', 'required', true),
      'groom_name', jsonb_build_object('type', 'text', 'label', 'Groom Name', 'required', true),
      'bride_city', jsonb_build_object('type', 'text', 'label', 'Bride City', 'required', false),
      'groom_city', jsonb_build_object('type', 'text', 'label', 'Groom City', 'required', false),
      'wedding_date', jsonb_build_object('type', 'date', 'label', 'Wedding Date', 'required', true),
      'wedding_time', jsonb_build_object('type', 'time', 'label', 'Wedding Time', 'required', true),
      'couple_tagline', jsonb_build_object('type', 'text', 'label', 'Couple Tagline', 'required', false),
      'display_order', jsonb_build_object('type', 'select', 'label', 'Name Display Order', 'options', jsonb_build_array('bride', 'groom'), 'required', true)
    ),
    'venue', jsonb_build_object(
      'venue_name', jsonb_build_object('type', 'text', 'label', 'Venue Name', 'required', true),
      'venue_address', jsonb_build_object('type', 'textarea', 'label', 'Venue Address', 'required', true),
      'venue_map_link', jsonb_build_object('type', 'text', 'label', 'Google Maps Link', 'required', false)
    ),
    'events', jsonb_build_object(
      'type', 'array',
      'label', 'Events',
      'fields', jsonb_build_object(
        'name', jsonb_build_object('type', 'text', 'label', 'Event Name', 'required', true),
        'date', jsonb_build_object('type', 'date', 'label', 'Event Date', 'required', true),
        'time', jsonb_build_object('type', 'time', 'label', 'Event Time', 'required', true),
        'venue', jsonb_build_object('type', 'text', 'label', 'Event Venue', 'required', true),
        'map_link', jsonb_build_object('type', 'text', 'label', 'Event Map Link', 'required', false),
        'description', jsonb_build_object('type', 'textarea', 'label', 'Event Description', 'required', false)
      )
    ),
    'family', jsonb_build_object(
      'bride_family', jsonb_build_object(
        'type', 'object',
        'label', 'Bride Family',
        'fields', jsonb_build_object(
          'title', jsonb_build_object('type', 'text', 'label', 'Family Title', 'required', false),
          'members', jsonb_build_object(
            'type', 'array',
            'label', 'Family Members',
            'fields', jsonb_build_object(
              'name', jsonb_build_object('type', 'text', 'label', 'Name', 'required', true),
              'relation', jsonb_build_object('type', 'text', 'label', 'Relation', 'required', false),
              'photo', jsonb_build_object('type', 'image', 'label', 'Photo', 'required', false),
              'description', jsonb_build_object('type', 'textarea', 'label', 'Description', 'required', false),
              'showInDialogOnly', jsonb_build_object('type', 'boolean', 'label', 'Show in Dialog Only', 'required', false)
            )
          )
        )
      ),
      'groom_family', jsonb_build_object(
        'type', 'object',
        'label', 'Groom Family',
        'fields', jsonb_build_object(
          'title', jsonb_build_object('type', 'text', 'label', 'Family Title', 'required', false),
          'members', jsonb_build_object(
            'type', 'array',
            'label', 'Family Members',
            'fields', jsonb_build_object(
              'name', jsonb_build_object('type', 'text', 'label', 'Name', 'required', true),
              'relation', jsonb_build_object('type', 'text', 'label', 'Relation', 'required', false),
              'photo', jsonb_build_object('type', 'image', 'label', 'Photo', 'required', false),
              'description', jsonb_build_object('type', 'textarea', 'label', 'Description', 'required', false),
              'showInDialogOnly', jsonb_build_object('type', 'boolean', 'label', 'Show in Dialog Only', 'required', false)
            )
          )
        )
      )
    ),
    'photos', jsonb_build_object(
      'type', 'array',
      'label', 'Photo Gallery',
      'fields', jsonb_build_object(
        'src', jsonb_build_object('type', 'image', 'label', 'Photo', 'required', true),
        'alt', jsonb_build_object('type', 'text', 'label', 'Alt Text', 'required', false),
        'title', jsonb_build_object('type', 'text', 'label', 'Title', 'required', false),
        'description', jsonb_build_object('type', 'textarea', 'label', 'Description', 'required', false)
      )
    ),
    'contacts', jsonb_build_object(
      'type', 'array',
      'label', 'Contacts',
      'fields', jsonb_build_object(
        'name', jsonb_build_object('type', 'text', 'label', 'Name', 'required', true),
        'phone', jsonb_build_object('type', 'text', 'label', 'Phone', 'required', true),
        'relation', jsonb_build_object('type', 'text', 'label', 'Relation', 'required', false)
      )
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'name', 'Welcome',
      'path', '/'
    ),
    jsonb_build_object(
      'name', 'Invitation',
      'path', '/invitation'
    )
  )
);