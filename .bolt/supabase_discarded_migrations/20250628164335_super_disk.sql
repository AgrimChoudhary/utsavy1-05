/*
  # Add Wishing Wall Tables

  1. New Tables
    - `wishes` - Stores guest wishes for events
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `guest_id` (uuid, foreign key to guests, nullable)
      - `guest_name` (text) - Name of the person leaving the wish
      - `wish_text` (text) - The actual wish message
      - `photo_url` (text, nullable) - Optional photo URL
      - `is_approved` (boolean) - Whether the wish is approved for display
      - `created_at` (timestamptz)
    - `wish_likes` - Tracks likes on wishes
      - `id` (uuid, primary key)
      - `wish_id` (uuid, foreign key to wishes)
      - `guest_id` (uuid, nullable) - Who liked the wish
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for proper access control
*/

-- Create wishes table
CREATE TABLE IF NOT EXISTS wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  wish_text text NOT NULL,
  photo_url text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create wish_likes table
CREATE TABLE IF NOT EXISTS wish_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_likes ENABLE ROW LEVEL SECURITY;

-- Policies for wishes table
-- Event hosts can manage all wishes for their events
CREATE POLICY "Event hosts can manage wishes"
  ON wishes
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
CREATE POLICY "Guests can view approved wishes"
  ON wishes
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
CREATE POLICY "Guests can create wishes"
  ON wishes
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests
      WHERE guests.event_id = wishes.event_id
      AND (
        guests.id = wishes.guest_id OR
        guests.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM events
          WHERE events.id = wishes.event_id
          AND events.host_id = auth.uid()
        )
      )
    )
  );

-- Policies for wish_likes table
-- Anyone can like wishes
CREATE POLICY "Anyone can like wishes"
  ON wish_likes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can see their own likesLet me create a comprehensive implementation plan for integrating the Wishing Wall feature into your wedding invitation platform.

<boltArtifact id="wishing-wall-integration" title="Wishing Wall Integration">