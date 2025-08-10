import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { signUpSchema, signInSchema } from '@/lib/validations';
import { CountryCodeSelect } from './CountryCodeSelect';
import { formatMobileNumber } from '@/utils/authHelpers';
import { Link } from 'react-router-dom';

type SignUpData = z.infer<typeof signUpSchema>;
type SignInData = z.infer<typeof signInSchema>;

export const AuthForm = () => {
  const { signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [signUpCountryCode, setSignUpCountryCode] = useState('+91');
  const [signInCountryCode, setSignInCountryCode] = useState('+91');
  const [loginByMobile, setLoginByMobile] = useState(false);

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  });

  const handleSignUp = async (data: SignUpData) => {
    setIsLoading(true);
    try {
      // Format mobile number with country code
      const formattedMobileNumber = formatMobileNumber(signUpCountryCode, data.mobile_number);
      
      // Attempt to sign up
      const { error } = await signUp(data.email, data.password, data.name, formattedMobileNumber);
      
      // If there's an error, set the appropriate field error
      if (error) {
        const errorMessage = error.message || '';
        
        // Check for email already registered error
        if (errorMessage.includes('email') && errorMessage.includes('already registered')) {
          signUpForm.setError('email', { 
            type: 'manual', 
            message: 'This email is already registered. Please sign in instead.' 
          });
        }
        
        // Check for mobile number already registered error
        else if (errorMessage.includes('mobile number') && errorMessage.includes('already registered')) {
          signUpForm.setError('mobile_number', { 
            type: 'manual', 
            message: 'This mobile number is already registered. Please sign in instead.' 
          });
        }
        
        // Generic error handling
        else if (errorMessage) {
          // Set error on the most relevant field, or fallback to email
          if (errorMessage.toLowerCase().includes('email')) {
            signUpForm.setError('email', { type: 'manual', message: errorMessage });
          } else if (errorMessage.toLowerCase().includes('password')) {
            signUpForm.setError('password', { type: 'manual', message: errorMessage });
          } else if (errorMessage.toLowerCase().includes('mobile') || errorMessage.toLowerCase().includes('phone')) {
            signUpForm.setError('mobile_number', { type: 'manual', message: errorMessage });
          } else {
            // Fallback to email field for generic errors
            signUpForm.setError('email', { type: 'manual', message: errorMessage });
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (data: SignInData) => {
    setIsLoading(true);
    try {
      let identifier = data.identifier;
      
      // If identifier looks like a phone number (contains only digits, spaces, dashes, parentheses)
      const isMobileNumber = /^[\d\s\-\(\)]+$/.test(identifier.trim());
      
      if (isMobileNumber) {
        // We'll pass the country code separately to signIn
        console.log('Signing in with mobile number:', identifier, 'and country code:', signInCountryCode);
      }
      
      const { error } = await signIn(identifier, data.password, isMobileNumber ? signInCountryCode : undefined);
      
      if (error) {
        // Set appropriate error message based on the error
        const errorMessage = error.message || '';
        
        if (errorMessage.includes('Invalid login credentials') || 
            errorMessage.includes('Invalid credentials')) {
          signInForm.setError('identifier', { 
            type: 'manual', 
            message: 'Invalid credentials. Please check your email/mobile and password.' 
          });
        } else if (errorMessage.includes('Email not confirmed')) {
          signInForm.setError('identifier', { 
            type: 'manual', 
            message: 'Please verify your email before signing in.' 
          });
        } else if (errorMessage.includes('User not found')) {
          signInForm.setError('identifier', { 
            type: 'manual', 
            message: 'Account not found. Please check your details or sign up.' 
          });
        } else {
          // Generic error on identifier field
          signInForm.setError('identifier', { type: 'manual', message: errorMessage });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Event Manager</CardTitle>
          <CardDescription>Create amazing events and invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="loginByMobile" 
                  checked={loginByMobile}
                  onCheckedChange={(checked) => {
                    setLoginByMobile(!!checked);
                    signInForm.clearErrors();
                  }}
                />
                <Label htmlFor="loginByMobile" className="text-sm">
                  Login by mobile number
                </Label>
              </div>

              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">
                    {loginByMobile ? 'Mobile Number' : 'Email or Mobile Number'}
                  </Label>
                  <div className="flex gap-2">
                    {loginByMobile && (
                      <CountryCodeSelect 
                        value={signInCountryCode} 
                        onValueChange={setSignInCountryCode} 
                      />
                    )}
                    <Input
                      id="identifier"
                      type="text"
                      placeholder={loginByMobile ? "1234567890" : "email@example.com or 1234567890"}
                      className="flex-1"
                      {...signInForm.register('identifier')}
                      onChange={(e) => {
                        signInForm.setValue('identifier', e.target.value);
                        signInForm.clearErrors('identifier');
                      }}
                    />
                  </div>
                  {signInForm.formState.errors.identifier && (
                    <p className="text-sm text-red-500">
                      {signInForm.formState.errors.identifier.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {loginByMobile 
                      ? 'Enter your mobile number without country code'
                      : 'Enter email or mobile number (without country code)'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    {...signInForm.register('password')}
                    onChange={(e) => {
                      signInForm.setValue('password', e.target.value);
                      signInForm.clearErrors('password');
                    }}
                  />
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {signInForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Link to="/reset-password" className="text-sm text-blue-600 hover:text-blue-800">
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...signUpForm.register('name')}
                    onChange={(e) => {
                      signUpForm.setValue('name', e.target.value);
                      signUpForm.clearErrors('name');
                    }}
                  />
                  {signUpForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {signUpForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...signUpForm.register('email')}
                    onChange={(e) => {
                      signUpForm.setValue('email', e.target.value);
                      signUpForm.clearErrors('email');
                    }}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile_number">Mobile Number</Label>
                  <div className="flex gap-2">
                    <CountryCodeSelect 
                      value={signUpCountryCode} 
                      onValueChange={setSignUpCountryCode} 
                    />
                    <Input
                      id="mobile_number"
                      placeholder="1234567890"
                      className="flex-1"
                      {...signUpForm.register('mobile_number')}
                      onChange={(e) => {
                        signUpForm.setValue('mobile_number', e.target.value);
                        signUpForm.clearErrors('mobile_number');
                      }}
                    />
                  </div>
                  {signUpForm.formState.errors.mobile_number && (
                    <p className="text-sm text-red-500">
                      {signUpForm.formState.errors.mobile_number.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Enter your mobile number without country code</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    {...signUpForm.register('password')}
                    onChange={(e) => {
                      signUpForm.setValue('password', e.target.value);
                      signUpForm.clearErrors('password');
                    }}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};