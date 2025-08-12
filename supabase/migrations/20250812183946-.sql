-- Secure wish submission RPC to fix RLS-related insert failures
-- Create a SECURITY DEFINER function that resolves event/guest IDs and inserts the wish safely

-- 1) Function: submit_wish_secure
CREATE OR REPLACE FUNCTION public.submit_wish_secure(
  p_event text,
  p_guest text,
  p_guest_name text,
  p_content text,
  p_photo_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_id uuid;
  v_guest_id uuid;
  v_event RECORD;
  inserted RECORD;
BEGIN
  -- Resolve event by UUID or custom_event_id
  SELECT * INTO v_event
  FROM public.events e
  WHERE (e.id::text = p_event) OR (e.custom_event_id = p_event)
  LIMIT 1;

  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  v_event_id := v_event.id;

  -- Ensure wishes feature is enabled
  IF COALESCE(v_event.wishes_enabled, true) = false THEN
    RAISE EXCEPTION 'Wishes are disabled for this event';
  END IF;

  -- Resolve guest by UUID or custom_guest_id within this event
  SELECT g.id INTO v_guest_id
  FROM public.guests g
  WHERE g.event_id = v_event_id
    AND (g.id::text = p_guest OR g.custom_guest_id = p_guest)
  LIMIT 1;

  IF v_guest_id IS NULL THEN
    RAISE EXCEPTION 'Guest not found for event';
  END IF;

  -- Insert wish
  INSERT INTO public.wishes (event_id, guest_id, guest_name, wish_text, photo_url)
  VALUES (v_event_id, v_guest_id, p_guest_name, p_content, p_photo_url)
  RETURNING * INTO inserted;

  -- Return sanitized wish JSON
  RETURN jsonb_build_object(
    'id', inserted.id,
    'event_id', inserted.event_id,
    'guest_id', inserted.guest_id,
    'guest_name', inserted.guest_name,
    'wish_text', inserted.wish_text,
    'photo_url', inserted.photo_url,
    'likes_count', inserted.likes_count,
    'is_approved', inserted.is_approved,
    'created_at', inserted.created_at
  );
END;
$$;

-- 2) Expose function to anon and authenticated roles
DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.submit_wish_secure(text, text, text, text, text) TO anon;
  GRANT EXECUTE ON FUNCTION public.submit_wish_secure(text, text, text, text, text) TO authenticated;
EXCEPTION WHEN others THEN
  -- Ignore grant errors if roles already have privileges
  NULL;
END $$;