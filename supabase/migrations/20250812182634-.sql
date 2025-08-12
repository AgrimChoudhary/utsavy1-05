-- 1) Tighten guests RLS and add secure RPCs for invitations

-- Drop overly permissive policy that allowed public ALL access
DROP POLICY IF EXISTS "Allow unauthenticated access to guest records for invitations" ON public.guests;

-- Ensure RLS remains enabled
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Authenticated guests can view their own record
CREATE POLICY IF NOT EXISTS "Authenticated guests can view their own record"
ON public.guests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- NOTE: Existing policy "Event hosts can manage guests" already permits hosts to manage their event guests.

-- 2) Secure RPC to fetch invitation data without exposing full guests table
CREATE OR REPLACE FUNCTION public.get_invitation_data(p_event text, p_guest text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_id uuid;
  v_guest_id uuid;
  e RECORD;
  g RECORD;
  t RECORD;
  event_json jsonb;
  guest_json jsonb;
  custom_fields jsonb;
BEGIN
  -- Resolve event by UUID or custom_event_id
  SELECT id INTO v_event_id
  FROM public.events
  WHERE (id::text = p_event) OR (custom_event_id = p_event)
  LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Resolve guest by UUID or custom_guest_id within this event
  SELECT id INTO v_guest_id
  FROM public.guests
  WHERE event_id = v_event_id
    AND (id::text = p_guest OR custom_guest_id = p_guest)
  LIMIT 1;

  IF v_guest_id IS NULL THEN
    RAISE EXCEPTION 'Guest not found for event';
  END IF;

  -- Load event and template
  SELECT e.*, tmp.* FROM public.events e
  LEFT JOIN public.templates tmp ON tmp.id = e.template_id
  WHERE e.id = v_event_id
  INTO e, t;

  -- Build sanitized event JSON (exclude host_id)
  event_json := jsonb_build_object(
    'id', e.id,
    'name', e.name,
    'details', e.details,
    'custom_event_id', e.custom_event_id,
    'page_name', e.page_name,
    'created_at', e.created_at,
    'allow_rsvp_edit', e.allow_rsvp_edit,
    'wishes_enabled', COALESCE(e.wishes_enabled, true),
    'rsvp_config', e.rsvp_config,
    'templates', CASE WHEN t.id IS NOT NULL THEN to_jsonb(t) ELSE NULL END
  );

  -- Load guest
  SELECT * FROM public.guests WHERE id = v_guest_id INTO g;

  -- Build sanitized guest JSON (omit mobile_number and user_id)
  guest_json := jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'event_id', g.event_id,
    'custom_guest_id', g.custom_guest_id,
    'viewed', g.viewed,
    'viewed_at', g.viewed_at,
    'accepted', g.accepted,
    'accepted_at', g.accepted_at,
    'rsvp_data', g.rsvp_data
  );

  -- Custom RSVP fields
  SELECT COALESCE(jsonb_agg(to_jsonb(rf)), '[]'::jsonb)
  INTO custom_fields
  FROM (
    SELECT * FROM public.get_event_custom_rsvp_fields(v_event_id)
  ) rf;

  RETURN jsonb_build_object(
    'event', event_json,
    'guest', guest_json,
    'custom_fields', custom_fields
  );
END;
$$;

-- 3) Secure RPC to update guest status with whitelist of columns
CREATE OR REPLACE FUNCTION public.update_guest_status_smart(p_event text, p_guest text, p_updates jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_id uuid;
  v_guest_id uuid;
  updated_guest RECORD;
BEGIN
  -- Resolve event
  SELECT id INTO v_event_id
  FROM public.events
  WHERE (id::text = p_event) OR (custom_event_id = p_event)
  LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Resolve guest within event
  SELECT id INTO v_guest_id
  FROM public.guests
  WHERE event_id = v_event_id
    AND (id::text = p_guest OR custom_guest_id = p_guest)
  LIMIT 1;

  IF v_guest_id IS NULL THEN
    RAISE EXCEPTION 'Guest not found for event';
  END IF;

  -- Perform constrained update
  UPDATE public.guests AS g
  SET
    viewed = COALESCE((p_updates->>'viewed')::boolean, g.viewed),
    viewed_at = COALESCE((p_updates->>'viewed_at')::timestamptz, g.viewed_at),
    accepted = COALESCE((p_updates->>'accepted')::boolean, g.accepted),
    accepted_at = COALESCE((p_updates->>'accepted_at')::timestamptz, g.accepted_at),
    rsvp_data = COALESCE(p_updates->'rsvp_data', g.rsvp_data)
  WHERE g.id = v_guest_id
  RETURNING g.* INTO updated_guest;

  -- Return sanitized updated guest JSON
  RETURN jsonb_build_object(
    'id', updated_guest.id,
    'name', updated_guest.name,
    'event_id', updated_guest.event_id,
    'custom_guest_id', updated_guest.custom_guest_id,
    'viewed', updated_guest.viewed,
    'viewed_at', updated_guest.viewed_at,
    'accepted', updated_guest.accepted,
    'accepted_at', updated_guest.accepted_at,
    'rsvp_data', updated_guest.rsvp_data
  );
END;
$$;