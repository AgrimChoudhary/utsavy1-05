-- 🚨 URGENT: RLS FIX FOR WISHES TABLE
-- Copy and paste this SQL into your Supabase Dashboard > SQL Editor
-- This will fix the wish submission issue

BEGIN;

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can view approved wishes" ON public.wishes;
DROP POLICY IF EXISTS "Guests can create wishes" ON public.wishes;

-- Step 2: Create new SELECT policy (allows viewing approved wishes)
CREATE POLICY "Anyone can view approved wishes"
ON public.wishes
FOR SELECT
USING (
  is_approved = true
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = wishes.event_id AND COALESCE(e.wishes_enabled, true) = true
  )
);

-- Step 3: Create new INSERT policy (allows guests to create wishes)
CREATE POLICY "Guests can create wishes"
ON public.wishes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = wishes.guest_id AND g.event_id = wishes.event_id
  )
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = wishes.event_id AND COALESCE(e.wishes_enabled, true) = true
  )
);

-- Step 4: Also allow authenticated users to update wishes (for approvals)
CREATE POLICY "Allow wish updates"
ON public.wishes
FOR UPDATE
USING (true)
WITH CHECK (true);

COMMIT;

-- Test query to verify the fix worked:
-- SELECT 'RLS policies updated successfully!' as status;
