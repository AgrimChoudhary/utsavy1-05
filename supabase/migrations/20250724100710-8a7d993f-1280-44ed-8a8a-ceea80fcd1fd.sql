-- Add theme_config column to templates table for storing theme colors and styling
ALTER TABLE public.templates 
ADD COLUMN theme_config jsonb DEFAULT '{
  "primary": "hsl(25, 47%, 35%)",
  "secondary": "hsl(43, 74%, 66%)", 
  "accent": "hsl(25, 47%, 25%)",
  "gradient": "linear-gradient(135deg, hsl(25, 47%, 35%), hsl(43, 74%, 66%))",
  "particleColor": "hsl(43, 74%, 66%)"
}'::jsonb;

-- Update existing templates with their specific theme configurations
UPDATE public.templates 
SET theme_config = '{
  "primary": "hsl(25, 47%, 35%)",
  "secondary": "hsl(43, 74%, 66%)", 
  "accent": "hsl(25, 47%, 25%)",
  "gradient": "linear-gradient(135deg, hsl(25, 47%, 35%), hsl(43, 74%, 66%))",
  "particleColor": "hsl(43, 74%, 66%)"
}'::jsonb
WHERE name = 'Royal Wedding Invitation - External';

UPDATE public.templates 
SET theme_config = '{
  "primary": "hsl(43, 74%, 66%)",
  "secondary": "hsl(0, 0%, 100%)", 
  "accent": "hsl(43, 84%, 56%)",
  "gradient": "linear-gradient(135deg, hsl(43, 74%, 66%), hsl(0, 0%, 100%))",
  "particleColor": "hsl(43, 74%, 66%)"
}'::jsonb
WHERE name = 'Royal Indian Wedding';