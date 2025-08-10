import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail, updateUserPassword } from '@/services/authService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/ui/Logo';

// Schema for email form
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Schema for password reset form
const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [hasResetToken, setHasResetToken] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  // Forms
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Check for access token in URL
  useEffect(() => {
    const checkForResetToken = async () => {
      // Get hash parameters from URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'recovery') {
        // Set the session with the recovery tokens
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('Error setting session:', error);
            toast({
              title: 'Error',
              description: 'Invalid or expired reset link. Please request a new one.',
              variant: 'destructive',
            });
          } else {
            setHasResetToken(true);
          }
        } catch (error) {
          console.error('Error setting session:', error);
          toast({
            title: 'Error',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
          });
        }
      }
    };

    checkForResetToken();
  }, [location]);

  const handleRequestReset = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const { error } = await sendPasswordResetEmail(data.email);
      if (!error) {
        setResetRequested(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await updateUserPassword(data.password);
      if (!error) {
        setResetComplete(true);
        // Clear the URL hash to remove tokens
        window.history.replaceState(null, '', window.location.pathname);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render the appropriate form based on the current state
  const renderContent = () => {
    if (resetComplete) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Password Reset Complete</h2>
          <p className="text-gray-600 mb-6">Your password has been successfully updated.</p>
          <Button onClick={() => navigate('/auth')} className="w-full">
            Sign In with New Password
          </Button>
        </div>
      );
    }

    if (hasResetToken) {
      return (
        <form onSubmit={passwordForm.handleSubmit(handlePasswordReset)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="password"
                type="password"
                className="pl-10"
                placeholder="Enter new password"
                {...passwordForm.register('password')}
              />
            </div>
            {passwordForm.formState.errors.password && (
              <p className="text-sm text-red-500">{passwordForm.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="confirmPassword"
                type="password"
                className="pl-10"
                placeholder="Confirm new password"
                {...passwordForm.register('confirmPassword')}
              />
            </div>
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
      );
    }

    if (resetRequested) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
          </p>
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setResetRequested(false)} className="w-full">
              Try Another Email
            </Button>
            <Button onClick={() => navigate('/auth')} variant="ghost" className="w-full">
              Back to Sign In
            </Button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={emailForm.handleSubmit(handleRequestReset)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="email"
              type="email"
              className="pl-10"
              placeholder="Enter your email address"
              {...emailForm.register('email')}
            />
          </div>
          {emailForm.formState.errors.email && (
            <p className="text-sm text-red-500">{emailForm.formState.errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">
            {resetComplete ? 'Password Reset Complete' : 
             hasResetToken ? 'Create New Password' : 
             resetRequested ? 'Check Your Email' : 'Reset Your Password'}
          </CardTitle>
          <CardDescription>
            {resetComplete ? 'Your password has been updated successfully' : 
             hasResetToken ? 'Enter a new password for your account' : 
             resetRequested ? 'We\'ve sent you a reset link' : 
             'Enter your email to receive a password reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          {!resetComplete && !resetRequested && !hasResetToken && (
            <Link to="/auth" className="text-sm text-gray-600 hover:text-gray-900 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;