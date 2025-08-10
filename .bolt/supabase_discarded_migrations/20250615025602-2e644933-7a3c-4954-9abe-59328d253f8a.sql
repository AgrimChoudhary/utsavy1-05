
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create Users table (profiles table to store additional user data)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create Templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  component_name TEXT NOT NULL,
  fields JSONB NOT NULL,
  pages JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.templates(id) NOT NULL,
  details JSONB NOT NULL,
  page_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Guests table
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed BOOLEAN NOT NULL DEFAULT false,
  accepted BOOLEAN NOT NULL DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Templates policies (public read access)
CREATE POLICY "Anyone can view templates" ON public.templates
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Admins can manage templates" ON public.templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Events policies
CREATE POLICY "Users can view their hosted events" ON public.events
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Users can create their own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = host_id);

-- Guests policies
CREATE POLICY "Event hosts can manage guests" ON public.guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE id = event_id AND host_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view guests for invitation access" ON public.guests
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Anyone can update guest interaction status" ON public.guests
  FOR UPDATE TO PUBLIC USING (true);

-- Insert default templates
INSERT INTO public.templates (name, component_name, fields, pages, thumbnail_url) VALUES
('Wedding Celebration', 'Template1', 
 '{"eventName": {"type": "text", "label": "Event Name", "required": true}, "date": {"type": "date", "label": "Date", "required": true}, "time": {"type": "time", "label": "Time", "required": true}, "venue": {"type": "text", "label": "Venue", "required": true}, "coupleNames": {"type": "text", "label": "Couple Names", "required": true}}',
 '{"welcome": {"title": "Welcome", "component": "WelcomePage"}, "details": {"title": "Event Details", "component": "DetailsPage"}, "rsvp": {"title": "RSVP", "component": "RSVPPage"}}',
 '/placeholder.svg'),
('Birthday Party', 'Template2',
 '{"eventName": {"type": "text", "label": "Event Name", "required": true}, "date": {"type": "date", "label": "Date", "required": true}, "time": {"type": "time", "label": "Time", "required": true}, "venue": {"type": "text", "label": "Venue", "required": true}, "celebrantName": {"type": "text", "label": "Celebrant Name", "required": true}, "age": {"type": "number", "label": "Age", "required": false}}',
 '{"welcome": {"title": "Welcome", "component": "WelcomePage"}, "details": {"title": "Party Details", "component": "DetailsPage"}, "rsvp": {"title": "RSVP", "component": "RSVPPage"}}',
 '/placeholder.svg'),
('Corporate Event', 'Template3',
 '{"eventName": {"type": "text", "label": "Event Name", "required": true}, "date": {"type": "date", "label": "Date", "required": true}, "time": {"type": "time", "label": "Time", "required": true}, "venue": {"type": "text", "label": "Venue", "required": true}, "company": {"type": "text", "label": "Company", "required": true}, "dresscode": {"type": "text", "label": "Dress Code", "required": false}}',
 '{"welcome": {"title": "Welcome", "component": "WelcomePage"}, "details": {"title": "Event Details", "component": "DetailsPage"}, "agenda": {"title": "Agenda", "component": "AgendaPage"}, "rsvp": {"title": "RSVP", "component": "RSVPPage"}}',
 '/placeholder.svg');

-- Create trigger function to create user profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, mobile_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'mobile_number', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger to handle new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
