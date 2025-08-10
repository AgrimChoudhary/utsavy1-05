import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const checkMobileNumberExists = async (mobile_number: string) => {
  try {
    console.log('Checking if mobile number exists:', mobile_number);
    
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('mobile_number')
      .eq('mobile_number', mobile_number)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking mobile number:', error);
      // Don't throw error, just return false to allow signup to proceed
      return false;
    }

    const exists = !!existingProfile;
    console.log('Mobile number exists:', exists);
    return exists;
  } catch (error) {
    console.error('Error in checkMobileNumberExists:', error);
    return false;
  }
};

export const checkEmailExists = async (email: string) => {
  try {
    console.log('Checking if email exists:', email);
    
    // Check in profiles table only
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking email in profiles:', profileError);
      return false;
    }

    if (existingProfile) {
      console.log('Email exists in profiles:', true);
      return true;
    }

    console.log('Email not found in profiles:', false);
    return false;
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    return false;
  }
};

export const findProfileByMobileNumber = async (mobile_number: string) => {
  console.log('Looking up profile by mobile number:', mobile_number);
  
  // Try exact match first
  const { data: exactProfile, error: exactError } = await supabase
    .from('profiles')
    .select('email, mobile_number')
    .eq('mobile_number', mobile_number)
    .maybeSingle();
    
  if (exactProfile) {
    console.log('Found profile with exact match:', exactProfile);
    return { profile: exactProfile, profileError: null };
  }
  
  if (exactError && exactError.code !== 'PGRST116') {
    console.error('Error in exact profile lookup:', exactError);
    return { profile: null, profileError: exactError };
  }
  
  // If no exact match, try without the country code format
  // This handles cases where the database might store "+91-1234567890" but user enters "1234567890"
  const cleanedNumber = mobile_number.replace(/^(\+\d+)-/, '');
  
  const { data: partialProfile, error: partialError } = await supabase
    .from('profiles')
    .select('email, mobile_number')
    .like('mobile_number', `%${cleanedNumber}`)
    .maybeSingle();
  
  if (partialProfile) {
    console.log('Found profile with partial match:', partialProfile);
    return { profile: partialProfile, profileError: null };
  }
  
  // If still no match, try with just the digits
  const digitsOnly = mobile_number.replace(/\D/g, '');
  
  const { data: digitsProfile, error: digitsError } = await supabase
    .from('profiles')
    .select('email, mobile_number')
    .filter('mobile_number', 'ilike', `%${digitsOnly}%`)
    .maybeSingle();
  
  if (digitsProfile) {
    console.log('Found profile with digits-only match:', digitsProfile);
    return { profile: digitsProfile, profileError: null };
  }
  
  console.log('No profile found for mobile number:', mobile_number);
  return { profile: null, profileError: digitsError || partialError || exactError };
};

export const isMobileNumberFormat = (identifier: string): boolean => {
  // Check if the identifier contains mostly digits with optional formatting characters
  return /^[\+]?[0-9\-\s\(\)]+$/.test(identifier.trim());
};

export const showAuthToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
  toast({
    title,
    description,
    variant,
    duration: 6000, // Show error messages longer so users can read them
  });
};

export const formatMobileNumber = (countryCode: string, number: string): string => {
  // Remove any non-digit characters except the + sign at the beginning
  const cleanedCountryCode = countryCode.replace(/[^\d+]/g, '');
  const cleanedNumber = number.replace(/\D/g, '');
  
  // Ensure country code starts with +
  const formattedCountryCode = cleanedCountryCode.startsWith('+') 
    ? cleanedCountryCode 
    : `+${cleanedCountryCode}`;
  
  // Return the formatted number with a hyphen between country code and number
  return `${formattedCountryCode}-${cleanedNumber}`;
};

export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email.trim()) {
    return { isValid: false, message: 'Email address is required.' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }
  
  return { isValid: true };
};

export const validateMobileNumber = (mobileNumber: string): { isValid: boolean; message?: string } => {
  const cleanedNumber = mobileNumber.replace(/\D/g, '');
  
  if (!mobileNumber.trim()) {
    return { isValid: false, message: 'Mobile number is required.' };
  }
  
  if (cleanedNumber.length < 10) {
    return { isValid: false, message: 'Mobile number must be at least 10 digits.' };
  }
  
  if (cleanedNumber.length > 15) {
    return { isValid: false, message: 'Mobile number cannot exceed 15 digits.' };
  }
  
  return { isValid: true };
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: 'Password is required.' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  
  return { isValid: true };
};