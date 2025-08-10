
-- Fix the RLS policy for profiles table to allow insertion during signup
-- The current policy is too restrictive and prevents profile creation during signup

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a new INSERT policy that allows profile creation during signup
-- This allows insertion when the user_id matches auth.uid() OR when auth.uid() is null (during signup)
CREATE POLICY "Users can insert their own profile during signup" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR auth.uid() IS NULL
  );

-- Also ensure the trigger function has proper permissions
-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, name, mobile_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'mobile_number', '')
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;
