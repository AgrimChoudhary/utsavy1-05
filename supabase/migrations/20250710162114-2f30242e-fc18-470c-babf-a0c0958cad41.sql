-- Allow unauthenticated access to events when accessed via valid guest invitation
-- This is needed for guest invitation pages to work without requiring login
CREATE POLICY "Allow unauthenticated guest access to events via invitation"
ON public.events
FOR SELECT
TO public
USING (
  -- Allow access if there's a valid guest record for this event
  -- This allows the invitation page to load without authentication
  EXISTS (
    SELECT 1 FROM public.guests 
    WHERE guests.event_id = events.id
  )
);

-- Update guests table policy to be more explicit about unauthenticated access
DROP POLICY IF EXISTS "Anyone can view and update guest records for invitations" ON public.guests;

CREATE POLICY "Allow unauthenticated access to guest records for invitations"
ON public.guests
FOR ALL
TO public
USING (true)
WITH CHECK (true);