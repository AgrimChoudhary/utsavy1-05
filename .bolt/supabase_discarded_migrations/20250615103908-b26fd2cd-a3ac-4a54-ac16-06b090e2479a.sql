
-- Check if templates table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'templates') THEN
        CREATE TABLE public.templates (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            component_name TEXT NOT NULL,
            fields JSONB NOT NULL,
            pages JSONB NOT NULL,
            thumbnail_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        -- Enable RLS on templates
        ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for templates (public read access)
        CREATE POLICY "Anyone can view templates" ON public.templates
            FOR SELECT USING (true);
    END IF;
END
$$;

-- Insert sample templates only if they don't already exist
DO $$
BEGIN
    -- Insert Wedding template if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.templates WHERE component_name = 'WeddingTemplate') THEN
        INSERT INTO public.templates (name, component_name, fields, pages, thumbnail_url)
        VALUES (
            'Wedding Invitation',
            'WeddingTemplate',
            '{
                "bride_name": {"label": "Bride Name", "type": "text", "required": true, "placeholder": "Enter bride name"},
                "groom_name": {"label": "Groom Name", "type": "text", "required": true, "placeholder": "Enter groom name"},
                "date": {"label": "Wedding Date", "type": "date", "required": true},
                "time": {"label": "Ceremony Time", "type": "time", "required": true},
                "reception_time": {"label": "Reception Time", "type": "time", "required": false},
                "venue": {"label": "Venue Name", "type": "text", "required": true, "placeholder": "Enter venue name"},
                "address": {"label": "Venue Address", "type": "text", "required": true, "placeholder": "Enter full address"},
                "dress_code": {"label": "Dress Code", "type": "text", "required": false, "placeholder": "e.g., Formal, Semi-formal"}
            }'::jsonb,
            '["welcome", "details", "rsvp"]'::jsonb,
            '/placeholder-wedding-template.jpg'
        );
    END IF;

    -- Insert Birthday template if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.templates WHERE component_name = 'BirthdayTemplate') THEN
        INSERT INTO public.templates (name, component_name, fields, pages, thumbnail_url)
        VALUES (
            'Birthday Party',
            'BirthdayTemplate',
            '{
                "birthday_person": {"label": "Birthday Person", "type": "text", "required": true, "placeholder": "Enter name"},
                "age": {"label": "Age", "type": "number", "required": false, "placeholder": "Enter age"},
                "date": {"label": "Party Date", "type": "date", "required": true},
                "time": {"label": "Party Time", "type": "time", "required": true},
                "venue": {"label": "Venue", "type": "text", "required": true, "placeholder": "Enter venue name"},
                "address": {"label": "Address", "type": "text", "required": true, "placeholder": "Enter full address"},
                "theme": {"label": "Party Theme", "type": "text", "required": false, "placeholder": "e.g., Superhero, Princess"},
                "special_instructions": {"label": "Special Instructions", "type": "textarea", "required": false, "placeholder": "Any special notes for guests"}
            }'::jsonb,
            '["welcome", "details", "rsvp"]'::jsonb,
            '/placeholder-birthday-template.jpg'
        );
    END IF;

    -- Insert Corporate template if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.templates WHERE component_name = 'CorporateTemplate') THEN
        INSERT INTO public.templates (name, component_name, fields, pages, thumbnail_url)
        VALUES (
            'Corporate Event',
            'CorporateTemplate',
            '{
                "event_type": {"label": "Event Type", "type": "text", "required": true, "placeholder": "e.g., Annual Meeting, Product Launch"},
                "company_name": {"label": "Company Name", "type": "text", "required": true, "placeholder": "Enter company name"},
                "date": {"label": "Event Date", "type": "date", "required": true},
                "time": {"label": "Start Time", "type": "time", "required": true},
                "end_time": {"label": "End Time", "type": "time", "required": false},
                "venue": {"label": "Venue", "type": "text", "required": true, "placeholder": "Enter venue name"},
                "address": {"label": "Address", "type": "text", "required": true, "placeholder": "Enter full address"},
                "agenda": {"label": "Agenda", "type": "textarea", "required": false, "placeholder": "Brief agenda or event description"}
            }'::jsonb,
            '["welcome", "details", "rsvp"]'::jsonb,
            '/placeholder-corporate-template.jpg'
        );
    END IF;
END
$$;
