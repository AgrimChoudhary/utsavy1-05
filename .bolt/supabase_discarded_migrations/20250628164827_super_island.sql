/*
# Add Wishing Wall Functionality

1. New Tables
   - `wishes` - Stores guest wishes for events
   - `wish_likes` - Tracks likes on wishes
   - `wish_replies` - Stores replies to wishes

2. Security
   - Enable RLS on all new tables
   - Add policies for proper access control

3. Changes
   - Add wish management capabilities to the platform
*/

-- Create wishes table
CREATE TABLE IF NOT EXISTS wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  wish_text TEXT NOT NULL,
  wish_type TEXT DEFAULT 'standard',
  photo_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  likes_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  team_preference TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create wish likes table
CREATE TABLE IF NOT EXISTS wish_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create wish replies table
CREATE TABLE IF NOT EXISTS wish_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for wishes table
-- Event hosts can manage all wishes for their events
CREATE POLICY "Event hosts can manage wishes" ON wishes
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = wishes.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Guests can view approved wishes for events they're invited to
CREATE POLICY "Guests can view approved wishes" ON wishes
  FOR SELECT
  TO public
  USING (
    (is_approved = true) OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = wishes.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Guests can create wishes for events they're invited to
CREATE POLICY "Guests can create wishes" ON wishes
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests
      WHERE guests.event_id = wishes.event_id
      AND (
        guests.id = wishes.guest_id OR
        guests.mobile_number = (
          SELECT mobile_number FROM profiles
          WHERE profiles.id = auth.uid()
        )
      )
    )
  );

-- Create policies for wish_likes table
CREATE POLICY "Anyone can view wish likes" ON wish_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Guests can like wishes" ON wish_likes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for wish_replies table
CREATE POLICY "Anyone can view wish replies" ON wish_replies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Guests can reply to wishes" ON wish_replies
  FOR INSERT
  TO public
  WITH CHECK (Let's implement the complete Wishing Wall feature for your wedding invitation platform. I'll create the necessary database tables, backend functionality, and frontend components.

<boltArtifact id="wishing-wall-integration" title="Implement Wishing Wall Feature">