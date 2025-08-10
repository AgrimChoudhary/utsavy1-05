
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTemplateCache } from '@/hooks/useTemplateCache';
import { Dashboard as DashboardComponent } from '@/components/dashboard/Dashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { preloadTemplates } = useTemplateCache();

  useEffect(() => {
    // LOGGING for debugging
    console.log('[Dashboard] Effect running. Loading:', loading, 'User:', user);

    if (!loading && !user) {
      console.log('[Dashboard] No user detected and not loading. Navigating to /auth.');
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Preload templates for instant access when user navigates to event management
  useEffect(() => {
    if (user && !loading) {
      preloadTemplates();
    }
  }, [user, loading, preloadTemplates]);

  if (loading) {
    console.log('[Dashboard] Loading, showing spinner.');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('[Dashboard] No user after loading. Returning null instead of Dashboard.');
    // Defensive: also trigger navigation here
    navigate('/auth', { replace: true });
    return null;
  }

  return <DashboardComponent />;
};

export default Dashboard;

