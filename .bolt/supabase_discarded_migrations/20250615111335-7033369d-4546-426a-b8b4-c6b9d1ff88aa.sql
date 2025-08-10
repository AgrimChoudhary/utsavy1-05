
-- Drop existing policies and recreate them properly

-- Drop existing policies on events table if they exist
DROP POLICY IF EXISTS "Users can view their hosted events" ON public.events;
DROP POLICY IF EXISTS "Users can create their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
DROP POLICY IF EXISTS "Hosts can manage their own events" ON public.events;
DROP POLICY IF EXISTS "Guests can view events they're invited to" ON public.events;

-- Drop existing policies on guests table if they exist
DROP POLICY IF EXISTS "Event hosts can manage guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can view guests for invitation access" ON public.guests;
DROP POLICY IF EXISTS "Anyone can update guest interaction status" ON public.guests;
DROP POLICY IF EXISTS "Guests can view and update their own records" ON public.guests;

-- Drop existing policies on profiles table if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;

-- Drop existing policies on user_roles table if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can manage user roles" ON public.user_roles;

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create new policies for events table
CREATE POLICY "Hosts can manage their own events" ON public.events
  FOR ALL USING (auth.uid() = host_id);

CREATE POLICY "Guests can view events they're invited to" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.guests 
      WHERE guests.event_id = events.id 
      AND guests.mobile_number IN (
        SELECT mobile_number FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Create new policies for guests table
CREATE POLICY "Event hosts can manage guests" ON public.guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = guests.event_id 
      AND events.host_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view and update guest records for invitations" ON public.guests
  FOR ALL TO PUBLIC USING (true);

-- Create new policies for profiles table
CREATE POLICY "Users can view and update their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Create new policies for user_roles table
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage user roles" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role');
