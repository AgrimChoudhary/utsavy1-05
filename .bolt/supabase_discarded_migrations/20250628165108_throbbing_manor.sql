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
CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  wish_text TEXT NOT NULL,
  wish_type TEXT DEFAULT 'standard',
  team_preference TEXT,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add event_id and guest_id columns to wishes table
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL;
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create wish_likes table to track likes
CREATE TABLE IF NOT EXISTS public.wish_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create wish_replies table for comments on wishes
CREATE TABLE IF NOT EXISTS public.wish_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for wishes table
CREATE POLICY "Guests can view approved wishes" 
  ON public.wishes 
  FOR SELECT 
  TO public 
  USING (is_approved = true);

CREATE POLICY "Event hosts can manage all wishes" 
  ON public.wishes 
  FOR ALL 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = wishes.event_id 
      AND events.host_id = auth.uid()
    )
  );

CREATE POLICY "Guests can create wishes" 
  ON public.wishes 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Create policies for wish_likes table
CREATE POLICY "Anyone can view wish likes" 
  ON public.wish_likes 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Anyone can like wishes" 
  ON public.wish_likes 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Create policies for wish_replies table
CREATE POLICY "Anyone can view wish replies" 
  ON public.wish_replies 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Event hosts can manage replies" 
  ON public.wish_replies 
  FOR ALL 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM wishes 
      JOIN events ON wishes.event_id = events.id 
      WHERE wish_replies.wish_id = wishes.id 
      AND events.host_id = auth.uid()
    )
  Let's implement the complete Wishing Wall feature for your wedding invitation platform. This will include:

1. Database schema updates to store wishes
2. Backend API endpoints for wish management
3. Frontend components for displaying and submitting wishes
4. Admin interface for managing wishes

## Step 1: Database Schema Updates

First, let's create a migration file to add the necessary tables for the wishing wall feature:

<boltArtifact id="wishing-wall-implementation" title="Implement Wishing Wall Feature">