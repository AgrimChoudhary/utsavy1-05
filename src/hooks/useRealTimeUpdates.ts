import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export const useRealTimeUpdates = (eventId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true); // Start as true to avoid immediate warning

  useEffect(() => {
    if (!user?.id) {
      console.log('🔌 Real-time: No user ID, skipping connection');
      return;
    }

    console.log('🔌 Real-time: Setting up connection for user:', user.id);

    const channel = supabase
      .channel('events-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `host_id=eq.${user.id}`
        },
        () => {
          // Invalidate events queries when events change
          queryClient.invalidateQueries({ queryKey: ['events'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests'
          // Only add filter if eventId is provided, otherwise monitor all guests for the user
        },
        () => {
          console.log('🔄 Real-time: Guests table changed, invalidating queries');
          // Invalidate guests, events, and analytics queries when guests change
          if (eventId) {
            queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
          }
          queryClient.invalidateQueries({ queryKey: ['events'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
        }
      )
      .subscribe((status) => {
        console.log('🔌 Real-time connection status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time connection established successfully');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time connection error');
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Real-time connection timed out');
        } else if (status === 'CLOSED') {
          console.log('🔌 Real-time connection closed');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, eventId, queryClient]);

  return { isConnected };
};
