import { useState, useEffect } from 'react';
import { SimpleRSVPService, EventStats } from '@/services/simpleRSVPService';

export const useSimpleEventStats = (eventId?: string) => {
  const [stats, setStats] = useState<EventStats>({
    total: 0,
    pending: 0,
    viewed: 0,
    accepted: 0,
    submitted: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const eventStats = await SimpleRSVPService.getEventStats(eventId);
      setStats(eventStats);
    } catch (err) {
      console.error('Failed to fetch event stats:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [eventId]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
};