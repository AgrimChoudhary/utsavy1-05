-- Fix the infinite recursion by removing the problematic policy
DROP POLICY IF EXISTS "Allow unauthenticated guest access to events via invitation" ON public.events;

-- Create a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.event_has_guests(event_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guests 
    WHERE event_id = event_uuid
  );
$$;

-- Now create the policy using the function
CREATE POLICY "Allow unauthenticated guest access to events via invitation"
ON public.events
FOR SELECT
TO public
USING (public.event_has_guests(id));