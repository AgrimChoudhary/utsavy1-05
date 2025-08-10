import { supabase } from '@/integrations/supabase/client';
import { checkMobileNumberExists, checkEmailExists, findProfileByMobileNumber, isMobileNumberFormat, showAuthToast } from '@/utils/authHelpers';

export const signUpUser = async (email: string, password: string, name: string, mobile_number: string) => {
  try {
    console.log('Attempting signup with:', { email, name, mobile_number });
    
    // Check if email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      const error = { message: `The email "${email}" is already registered. Please sign in instead or use a different email address.` };
      showAuthToast("Email Already Registered", error.message, "destructive");
      return { error };
    }
    
    // Check if mobile number already exists in profiles
    const mobileExists = await checkMobileNumberExists(mobile_number);
    if (mobileExists) {
      const error = { message: `The mobile number "${mobile_number}" is already registered. Please sign in instead or use a different mobile number.` };
      showAuthToast("Mobile Number Already Registered", error.message, "destructive");
      return { error };
    }

    // Use production domain for redirect
    const redirectUrl = `https://utsavy-invitations.vercel.app/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          mobile_number
        }
      }
    });

    console.log('Signup response:', { data, error });

    if (error) {
      console.error('Signup error:', error);
      
      // Handle specific Supabase auth errors with user-friendly messages
      let errorMessage = error.message;
      
      if (error.message.includes('User already registered')) {
        errorMessage = `The email "${email}" is already registered. Please sign in instead.`;
      } else if (error.message.includes('Invalid email')) {
        errorMessage = `Please enter a valid email address. "${email}" is not a valid email format.`;
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long. Please choose a stronger password.';
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = 'Too many signup attempts. Please wait a few minutes before trying again.';
      } else if (error.message.includes('Signup is disabled')) {
        errorMessage = 'New registrations are temporarily disabled. Please try again later.';
      }
      
      showAuthToast("Registration Failed", errorMessage, "destructive");
    } else if (data.user) {
      showAuthToast(
        "Check your email",
        `We've sent a verification link to ${email}. Please verify your email to complete registration.`
      );
    }

    return { error };
  } catch (err: any) {
    console.error('Signup error:', err);
    const error = { message: err.message || 'An unexpected error occurred during registration. Please try again.' };
    showAuthToast("Registration Error", error.message, "destructive");
    return { error };
  }
};

export const signInUser = async (identifier: string, password: string, countryCode?: string) => {
  try {
    let email = identifier;
    
    // Check if identifier looks like a mobile number
    if (isMobileNumberFormat(identifier)) {
      console.log('Looking up mobile number:', identifier.trim());
      
      // Format the mobile number with country code if provided
      let formattedMobileNumber = identifier.trim();
      
      // Clean the mobile number (remove spaces, dashes, parentheses)
      const cleanNumber = formattedMobileNumber.replace(/[\s\-\(\)\+]/g, '');
      
      // If country code is provided and the number doesn't already have it
      if (countryCode && !formattedMobileNumber.startsWith('+')) {
        formattedMobileNumber = `${countryCode}-${cleanNumber}`;
      } else if (!formattedMobileNumber.includes('-')) {
        // If no hyphen, assume we need to add it after the country code
        if (formattedMobileNumber.startsWith('+')) {
          // Extract country code and remaining digits
          const countryCodeMatch = formattedMobileNumber.match(/^\+(\d+)/);
          if (countryCodeMatch) {
            const extractedCountryCode = countryCodeMatch[0];
            const remainingDigits = formattedMobileNumber.substring(extractedCountryCode.length);
            formattedMobileNumber = `${extractedCountryCode}-${remainingDigits}`;
          } else {
            // Fallback if we can't extract country code
            formattedMobileNumber = `+91-${cleanNumber}`;
          }
        } else {
          // No + prefix, use the provided country code or default to +91
          formattedMobileNumber = `${countryCode || '+91'}-${cleanNumber}`;
        }
      }
      
      console.log('Formatted mobile number for lookup:', formattedMobileNumber);
      
      const { profile, profileError } = await findProfileByMobileNumber(formattedMobileNumber);
      
      if (profileError) {
        console.error('Profile lookup error:', profileError);
        const error = { message: 'Error looking up mobile number. Please try again.' };
        showAuthToast("Sign In Error", error.message, "destructive");
        return { error };
      }
      
      if (!profile) {
        console.log('No profile found for mobile number:', formattedMobileNumber);
        const error = { message: `No account found with mobile number "${identifier}". Please check the number or sign up for a new account.` };
        showAuthToast("Account Not Found", error.message, "destructive");
        return { error };
      }
      
      email = profile.email;
      console.log('Found email for mobile number:', email);
    }

    console.log('Attempting sign in with email:', email);

    // Sign in with the email (either provided directly or looked up from mobile)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('SignIn password error:', error);
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        if (isMobileNumberFormat(identifier)) {
          errorMessage = `Invalid credentials for mobile number "${identifier}". Please check your mobile number and password, or sign up if you don't have an account.`;
        } else {
          errorMessage = `Invalid credentials for email "${identifier}". Please check your email and password, or sign up if you don't have an account.`;
        }
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = `Please verify your email address before signing in. Check your inbox for the verification link sent to ${email}.`;
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
      } else if (error.message.includes('User not found')) {
        if (isMobileNumberFormat(identifier)) {
          errorMessage = `No account found with mobile number "${identifier}". Please sign up for a new account.`;
        } else {
          errorMessage = `No account found with email "${identifier}". Please sign up for a new account.`;
        }
      }
      
      showAuthToast("Sign In Failed", errorMessage, "destructive");
    } else {
      console.log('Sign in successful');
      showAuthToast("Welcome back!", "You have successfully signed in.");
    }

    return { error };
  } catch (err: any) {
    console.error('SignIn error:', err);
    const error = { message: err.message || 'An unexpected error occurred during sign in' };
    showAuthToast("Sign In Error", error.message, "destructive");
    return { error };
  }
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    showAuthToast("Sign Out Error", error.message, "destructive");
  }
  return { error };
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    // Use production domain for redirect
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      console.error('Password reset error:', error);
      showAuthToast("Password Reset Error", error.message, "destructive");
      return { error };
    }

    showAuthToast(
      "Check your email",
      "We've sent you a password reset link. Please check your inbox."
    );
    return { error: null };
  } catch (err: any) {
    console.error('Password reset error:', err);
    const error = { message: err.message || 'An unexpected error occurred' };
    showAuthToast("Password Reset Error", error.message, "destructive");
    return { error };
  }
};

export const updateUserPassword = async (password: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      console.error('Password update error:', error);
      showAuthToast("Password Update Error", error.message, "destructive");
      return { error };
    }

    showAuthToast(
      "Password Updated",
      "Your password has been successfully updated."
    );
    return { error: null };
  } catch (err: any) {
    console.error('Password update error:', err);
    const error = { message: err.message || 'An unexpected error occurred' };
    showAuthToast("Password Update Error", error.message, "destructive");
    return { error };
  }
};