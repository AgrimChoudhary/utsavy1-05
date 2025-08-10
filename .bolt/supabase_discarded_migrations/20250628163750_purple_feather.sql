/*
  # Add Wishing Wall Functionality

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
    - Add policies for proper access control
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
  UNIQUE(wish_id, guest_id) -- Prevent duplicate likes
);

-- Enable Row Level Security
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_likes ENABLE ROW LEVEL SECURITY;

-- Policies for wishes table
-- Event hosts can manage all wishes for their events
CREATE POLICY "Event hosts can manage wishes"
  ON wishes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = wishes.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Guests can view approved wishes for events they're invited to
CREATE POLICY "Guests can view approved wishes"
  ON wishes
  FOR SELECT
  TO public
  USING (
    is_approved = true
  );

-- Guests can create wishes for events they're invited to
CREATE POLICY "Guests can create wishes"
  ON wishes
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests
      WHERE guests.id = wishes.guest_id
      AND guests.event_id = wishes.event_id
    )
  );

-- Policies for wish_likes table
-- Event hosts can view all likes
CREATE POLICY "Event hosts can view all likes"
  ON wish_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wishes
      JOIN events ON wishes.event_id = events.id
      WHERE wishes.id = wish_likes.wish_id
      AND events.host_id = auth.uid()
    )
  );

-- Guests can like wishes
CREATE POLICY "Guests can like wishes"
  ON wish_likes
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wishes
      WHERE wishes.id = wish_likes.wish_id
      AND wishes.is_approved = true
    )
  );

-- Guests can remove their own likes
CREATE POLICY "Guests can remove their own likes"
  ON wish_likes
  FOR DELETE
  TO public
  USING (
    guest_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM wishes
      JOIN eventsLet's implement the complete Wishing Wall feature for your wedding invitation platform. I'll create the necessary database tables, backend functionality, and frontend components.

<boltArtifact id="wishing-wall-integration" title="Implement Wishing Wall Feature">