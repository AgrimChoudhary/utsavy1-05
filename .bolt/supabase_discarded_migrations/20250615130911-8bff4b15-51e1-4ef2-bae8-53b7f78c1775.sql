
-- Drop all existing policies on events table to start fresh
DROP POLICY IF EXISTS "Allow select events for all authenticated" ON public.events;
DROP POLICY IF EXISTS "Guests can view events they're invited to" ON public.events;
DROP POLICY IF EXISTS "Hosts can manage their own events" ON public.events;

-- Create a simple, non-recursive policy for hosts to manage their own events
CREATE POLICY "Hosts can manage their own events" ON public.events
  FOR ALL USING (auth.uid() = host_id);

-- Create a security definer function to check if user is invited to an event
-- This prevents recursion by using a separate function context
CREATE OR REPLACE FUNCTION public.user_can_view_event(event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guests 
    WHERE guests.event_id = user_can_view_event.event_id 
    AND guests.mobile_number IN (
      SELECT mobile_number FROM public.profiles WHERE id = auth.uid()
    )
  );
$$;

-- Create policy for guests to view events they're invited to using the function
CREATE POLICY "Guests can view events they're invited to" ON public.events
  FOR SELECT USING (public.user_can_view_event(id));
