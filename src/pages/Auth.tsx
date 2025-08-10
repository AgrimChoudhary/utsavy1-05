
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // LOGGING for debugging
    console.log('[Auth] Effect running. Loading:', loading, 'User:', user);

    if (!loading && user) {
      console.log('[Auth] User is present. Navigating to /dashboard.');
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    console.log('[Auth] Loading, showing spinner.');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return <AuthForm />;
};

export default Auth;
