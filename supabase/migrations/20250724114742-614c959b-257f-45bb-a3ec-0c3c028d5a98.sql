-- Enhance template theme_config structure for better loading screen management
-- Update existing templates with enhanced theme configurations

-- Update Royal Wedding Invitation - External template
UPDATE templates 
SET theme_config = jsonb_build_object(
  'primary', 'hsl(45, 100%, 70%)',
  'secondary', 'hsl(35, 90%, 60%)', 
  'accent', 'hsl(0, 70%, 45%)',
  'background', 'linear-gradient(135deg, hsl(0, 70%, 25%) 0%, hsl(0, 60%, 30%) 25%, hsl(340, 65%, 35%) 50%, hsl(0, 70%, 20%) 75%, hsl(350, 75%, 15%) 100%)',
  'particleColors', jsonb_build_array('#FFD700', '#FFA500', '#FF6347', '#FFB347'),
  'textColors', jsonb_build_object(
    'primary', '#FFD700',
    'secondary', '#FFA500', 
    'accent', '#DC143C',
    'blessing', '#FFFF99'
  ),
  'loadingMessages', jsonb_build_object(
    'welcome', 'Namaste, {guestName}!',
    'preparing', 'Unveiling your royal invitation...',
    'blessing', 'May this auspicious moment bring joy',
    'celebration', 'A regal celebration awaits your presence',
    'final', 'Welcome to {eventName}'
  ),
  'overlayPattern', 'radial-gradient(circle at 20% 20%, hsla(45, 100%, 70%, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 40%, hsla(35, 90%, 60%, 0.08) 0%, transparent 50%), radial-gradient(circle at 40% 80%, hsla(25, 85%, 65%, 0.06) 0%, transparent 50%)',
  'glowEffects', jsonb_build_object(
    'iconGlow', '0 0 30px hsla(45, 100%, 70%, 0.6), 0 0 60px hsla(45, 100%, 70%, 0.3)',
    'textGlow', '0 0 20px hsla(45, 100%, 70%, 0.5)',
    'particleGlow', '0 0 15px hsla(35, 90%, 60%, 0.7)'
  )
)
WHERE name = 'Royal Wedding Invitation - External';

-- Update Royal Indian Wedding template  
UPDATE templates
SET theme_config = jsonb_build_object(
  'primary', 'hsl(45, 70%, 60%)',
  'secondary', 'hsl(350, 40%, 75%)',
  'accent', 'hsl(0, 100%, 27%)', 
  'background', 'linear-gradient(135deg, hsl(30, 25%, 95%) 0%, hsl(25, 30%, 92%) 25%, hsl(350, 20%, 88%) 50%, hsl(25, 35%, 90%) 75%, hsl(30, 30%, 93%) 100%)',
  'particleColors', jsonb_build_array('#B8860B', '#DDA0DD', '#F5DEB3', '#CD853F'),
  'textColors', jsonb_build_object(
    'primary', '#B8860B',
    'secondary', '#DDA0DD',
    'accent', '#8B0000', 
    'blessing', '#CD853F'
  ),
  'loadingMessages', jsonb_build_object(
    'welcome', 'Namaste, {guestName}!',
    'preparing', 'Unveiling your elegant invitation...',
    'blessing', 'Blessings for this sacred union',
    'celebration', 'An elegant celebration of love awaits',
    'final', '{eventName} - A Journey of Love'
  ),
  'overlayPattern', 'radial-gradient(circle at 25% 25%, hsla(45, 80%, 75%, 0.12) 0%, transparent 60%), radial-gradient(circle at 75% 30%, hsla(350, 40%, 85%, 0.08) 0%, transparent 55%), radial-gradient(circle at 50% 75%, hsla(25, 60%, 80%, 0.1) 0%, transparent 65%)',
  'glowEffects', jsonb_build_object(
    'iconGlow', '0 0 25px hsla(45, 70%, 60%, 0.4), 0 0 45px hsla(45, 70%, 60%, 0.2)',
    'textGlow', '0 0 15px hsla(45, 70%, 60%, 0.3)', 
    'particleGlow', '0 0 12px hsla(350, 40%, 75%, 0.5)'
  )
)
WHERE name = 'Royal Indian Wedding';