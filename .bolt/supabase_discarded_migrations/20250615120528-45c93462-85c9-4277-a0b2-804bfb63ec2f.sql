
-- Remove all RLS policies on the events table (fixes recursion)
DROP POLICY IF EXISTS "enable select for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Users can select their own events" ON public.events;
DROP POLICY IF EXISTS "select_if_host" ON public.events;

-- (If you know the actual policy names, add them above.)

-- Enable basic RLS for development
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to select events (for development/testing)
CREATE POLICY "Allow select events for all authenticated" ON public.events
  FOR SELECT USING (auth.role() = 'authenticated');

-- You can refine later!
