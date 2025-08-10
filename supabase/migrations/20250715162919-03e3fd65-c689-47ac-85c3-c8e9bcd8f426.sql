-- Update the Royal Indian Wedding template to remove showInDialogOnly and ensure proper structure
UPDATE templates 
SET fields = jsonb_build_object(
  'couple', jsonb_build_object(
    'bride_name', jsonb_build_object('type', 'text', 'label', 'Bride Name', 'required', true),
    'groom_name', jsonb_build_object('type', 'text', 'label', 'Groom Name', 'required', true),
    'wedding_date', jsonb_build_object('type', 'date', 'label', 'Wedding Date', 'required', true),
    'wedding_time', jsonb_build_object('type', 'time', 'label', 'Wedding Time', 'required', true),
    'couple_tagline', jsonb_build_object('type', 'text', 'label', 'Couple Tagline', 'required', false),
    'bride_city', jsonb_build_object('type', 'text', 'label', 'Bride City', 'required', false),
    'groom_city', jsonb_build_object('type', 'text', 'label', 'Groom City', 'required', false),
    'display_order', jsonb_build_object('type', 'select', 'label', 'Name Display Order', 'required', true, 'options', jsonb_build_array('bride', 'groom'))
  ),
  'venue', jsonb_build_object(
    'venue_name', jsonb_build_object('type', 'text', 'label', 'Venue Name', 'required', true),
    'venue_address', jsonb_build_object('type', 'textarea', 'label', 'Venue Address', 'required', true),
    'venue_map_link', jsonb_build_object('type', 'text', 'label', 'Google Maps Link', 'required', false)
  ),
  'family', jsonb_build_object(
    'bride_family', jsonb_build_object(
      'label', 'Bride Family',
      'type', 'object',
      'fields', jsonb_build_object(
        'title', jsonb_build_object('type', 'text', 'label', 'Family Title', 'required', false),
        'parents_name', jsonb_build_object('type', 'text', 'label', 'Parents Name', 'required', false),
        'family_photo', jsonb_build_object('type', 'image', 'label', 'Family Photo', 'required', false),
        'members', jsonb_build_object(
          'type', 'array',
          'label', 'Family Members',
          'fields', jsonb_build_object(
            'name', jsonb_build_object('type', 'text', 'label', 'Name', 'required', true),
            'relation', jsonb_build_object('type', 'text', 'label', 'Relation', 'required', false),
            'photo', jsonb_build_object('type', 'image', 'label', 'Photo', 'required', false),
            'description', jsonb_build_object('type', 'textarea', 'label', 'Description', 'required', false)
          )
        )
      )
    ),
    'groom_family', jsonb_build_object(
      'label', 'Groom Family',
      'type', 'object',
      'fields', jsonb_build_object(
        'title', jsonb_build_object('type', 'text', 'label', 'Family Title', 'required', false),
        'parents_name', jsonb_build_object('type', 'text', 'label', 'Parents Name', 'required', false),
        'family_photo', jsonb_build_object('type', 'image', 'label', 'Family Photo', 'required', false),
        'members', jsonb_build_object(
          'type', 'array',
          'label', 'Family Members',
          'fields', jsonb_build_object(
            'name', jsonb_build_object('type', 'text', 'label', 'Name', 'required', true),
            'relation', jsonb_build_object('type', 'text', 'label', 'Relation', 'required', false),
            'photo', jsonb_build_object('type', 'image', 'label', 'Photo', 'required', false),
            'description', jsonb_build_object('type', 'textarea', 'label', 'Description', 'required', false)
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
      'title', jsonb_build_object('type', 'text', 'label', 'Title', 'required', false),
      'description', jsonb_build_object('type', 'textarea', 'label', 'Description', 'required', false),
      'alt', jsonb_build_object('type', 'text', 'label', 'Alt Text', 'required', false)
    )
  ),
  'events', jsonb_build_object(
    'type', 'array',
    'label', 'Events',
    'fields', jsonb_build_object(
      'name', jsonb_build_object('type', 'text', 'label', 'Event Name', 'required', true),
      'date', jsonb_build_object('type', 'date', 'label', 'Event Date', 'required', true),
      'time', jsonb_build_object('type', 'time', 'label', 'Event Time', 'required', true),
      'venue', jsonb_build_object('type', 'text', 'label', 'Event Venue', 'required', true),
      'description', jsonb_build_object('type', 'textarea', 'label', 'Event Description', 'required', false),
      'map_link', jsonb_build_object('type', 'text', 'label', 'Event Map Link', 'required', false)
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
)
WHERE name = 'Royal Indian Wedding';

-- Add support for flexible template metadata and field types for future templates
-- Add columns to store template-specific configurations
ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_version VARCHAR(10) DEFAULT '1.0';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS field_types JSONB DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS ui_config JSONB DEFAULT '{}';

-- Create index for better performance on template queries
CREATE INDEX IF NOT EXISTS idx_templates_template_type ON templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_component_name ON templates(component_name);

-- Add constraint to ensure external templates have external_url
ALTER TABLE templates ADD CONSTRAINT check_external_url 
CHECK (
  (template_type != 'external') OR 
  (template_type = 'external' AND external_url IS NOT NULL)
);

-- Update the Royal Indian Wedding template with additional metadata
UPDATE templates 
SET 
  template_version = '1.0',
  field_types = jsonb_build_object(
    'text', jsonb_build_object('input_type', 'text', 'validation', 'string'),
    'textarea', jsonb_build_object('input_type', 'textarea', 'validation', 'string'),
    'date', jsonb_build_object('input_type', 'date', 'validation', 'date'),
    'time', jsonb_build_object('input_type', 'time', 'validation', 'time'),
    'image', jsonb_build_object('input_type', 'file', 'validation', 'image', 'accept', 'image/*'),
    'select', jsonb_build_object('input_type', 'select', 'validation', 'enum'),
    'array', jsonb_build_object('input_type', 'dynamic', 'validation', 'array'),
    'object', jsonb_build_object('input_type', 'nested', 'validation', 'object')
  ),
  validation_rules = jsonb_build_object(
    'max_family_members', 20,
    'max_events', 10,
    'max_photos', 50,
    'max_contacts', 10,
    'required_fields', jsonb_build_array('couple.bride_name', 'couple.groom_name', 'couple.wedding_date', 'venue.venue_name')
  ),
  ui_config = jsonb_build_object(
    'sections', jsonb_build_array('couple', 'venue', 'family', 'photos', 'events', 'contacts'),
    'responsive', true,
    'theme', 'royal',
    'layout', 'tabbed'
  )
WHERE name = 'Royal Indian Wedding';