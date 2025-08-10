/*
# Add Wishing Wall Tables

1. New Tables
  - `wishes` - Stores guest wishes for events
    - `id` (uuid, primary key)
    - `event_id` (uuid, foreign key to events)
    - `guest_id` (uuid, foreign key to guests)
    - `message` (text)
    - `photo_url` (text, nullable)
    - `is_approved` (boolean, default false)
    - `created_at` (timestamptz)
  - `wish_likes` - Stores likes on wishes
    - `id` (uuid, primary key)
    - `wish_id` (uuid, foreign key to wishes)
    - `guest_id` (uuid, foreign key to guests)
    - `created_at` (timestamptz)

2. Security
  - Enable RLS on both tables
  - Add policies for guests to create wishes
  - Add policies for event hosts to manage wishes
  - Add policies for guests to like wishes
*/

-- Create wishes table
CREATE TABLE IF NOT EXISTS wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  message text NOT NULL,
  photo_url text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create wish_likes table
CREATE TABLE IF NOT EXISTS wish_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wish_id, guest_id)
);

-- Enable Row Level Security
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_likes ENABLE ROW LEVEL SECURITY;

-- Policies for wishes table
-- Guests can view approved wishes for events they're invited to
CREATE POLICY "Guests can view approved wishes" ON wishes
  FOR SELECT
  TO public
  USING (
    is_approved = true OR
    guest_id = auth.uid() OR
    event_id IN (
      SELECT events.id FROM events
      WHERE events.host_id = auth.uid()
    )
  );

-- Guests can create wishes for events they're invited to
CREATE POLICY "Guests can create wishes" ON wishes
  FOR INSERT
  TO public
  WITH CHECK (
    guest_id = auth.uid() OR
    guest_id IN (
      SELECT guests.id FROM guests
      WHERE guests.user_id = auth.uid()
    )
  );

-- Event hosts can manage all wishes for their events
CREATE POLICY "Event hosts can manage wishes" ON wishes
  FOR ALL
  TO public
  USING (
    event_id IN (
      SELECT events.id FROM events
      WHERE events.host_id = auth.uid()
    )
  );

-- Policies for wish_likes table
-- Guests can view likes
CREATE POLICY "Anyone can view likes" ON wish_likes
  FOR SELECT
  TO public
  USING (true);

-- Guests can like wishes
CREATE POLICY "Guests can like wishes" ON wish_likes
  FOR INSERT
  TO public
  WITH CHECK (
    guest_id = auth.uid() OR
    guest_id IN (
      SELECT guests.id FROM guests
      WHERE guests.user_id = auth.uid()
    )
  );

-- Guests can remove their own likes
CREATE POLICY "Guests can remove their own likes" ON wish_likes
  FOR DELETE
  TO public
  USING (
    guest_id = auth.uid() OR
    guest_id IN (
      SELECT guests.id FROM guests
      WHERE guests.user_id = auth.uid()Let's implement the complete Wishing Wall feature for your wedding invitation platform. I'll create the necessary database tables, backend functionality, and frontend components.

<boltArtifact id="wishing-wall-integration" title="Implement Wishing Wall Feature">