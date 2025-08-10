-- Allow unauthenticated access to templates for guest invitations
-- Templates are needed to render the invitation pages
CREATE POLICY "Allow unauthenticated access to templates for invitations"
ON public.templates
FOR SELECT
TO public
USING (true);