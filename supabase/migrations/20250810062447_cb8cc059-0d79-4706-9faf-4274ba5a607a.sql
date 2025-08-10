-- Wishing Wall core schema and policies
-- 1) Tables
CREATE TABLE IF NOT EXISTS public.wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  wish_text text NOT NULL,
  photo_url text,
  is_approved boolean NOT NULL DEFAULT false,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wish_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wish_id, guest_id)
);

-- 2) Enable RLS
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_likes ENABLE ROW LEVEL SECURITY;

-- 3) Policies for wishes
-- Hosts can manage their event wishes (select/insert/update/delete)
DROP POLICY IF EXISTS "Hosts can manage wishes" ON public.wishes;
CREATE POLICY "Hosts can manage wishes"
  ON public.wishes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = wishes.event_id
        AND e.host_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = wishes.event_id
        AND e.host_id = auth.uid()
    )
  );

-- Anyone can view approved wishes
DROP POLICY IF EXISTS "Anyone can view approved wishes" ON public.wishes;
CREATE POLICY "Anyone can view approved wishes"
  ON public.wishes
  FOR SELECT
  TO public
  USING (is_approved = true);

-- Hosts can view all wishes for their events (explicit select)
DROP POLICY IF EXISTS "Hosts can view all wishes (select)" ON public.wishes;
CREATE POLICY "Hosts can view all wishes (select)"
  ON public.wishes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = wishes.event_id
        AND e.host_id = auth.uid()
    )
  );

-- Guests can create wishes for events they're invited to
DROP POLICY IF EXISTS "Guests can create wishes" ON public.wishes;
CREATE POLICY "Guests can create wishes"
  ON public.wishes
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guests g
      WHERE g.id = wishes.guest_id
        AND g.event_id = wishes.event_id
    )
  );

-- 4) Policies for wish_likes
-- Anyone can view likes
DROP POLICY IF EXISTS "Anyone can view likes" ON public.wish_likes;
CREATE POLICY "Anyone can view likes"
  ON public.wish_likes
  FOR SELECT
  TO public
  USING (true);

-- Guests can like approved wishes
DROP POLICY IF EXISTS "Guests can like wishes" ON public.wish_likes;
CREATE POLICY "Guests can like wishes"
  ON public.wish_likes
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishes w
      WHERE w.id = wish_likes.wish_id
        AND w.is_approved = true
    )
    AND EXISTS (
      SELECT 1 FROM public.guests g
      WHERE g.id = wish_likes.guest_id
    )
  );

-- Guests can remove their own likes
DROP POLICY IF EXISTS "Guests can remove their own likes" ON public.wish_likes;
CREATE POLICY "Guests can remove their own likes"
  ON public.wish_likes
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.guests g
      WHERE g.id = wish_likes.guest_id
    )
  );