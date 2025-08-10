import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, Template } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching templates:', error);
        throw new Error('Failed to load templates. Please try again.');
      }
      return data as Template[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};

const handleAuthError = async (error: any, queryClient: any) => {
  if (error?.message?.includes('JWT expired') || 
      error?.code === 'PGRST301' || 
      error?.status === 401) {
    console.log('JWT expired, signing out user');
    
    // Clear all cached data
    queryClient.clear();
    
    // Sign out the user - handle session_not_found gracefully
    try {
      await supabase.auth.signOut();
    } catch (signOutError: any) {
      // If session doesn't exist on server, treat as successful logout
      if (signOutError?.message?.includes('session_not_found') || 
          signOutError?.message?.includes('Session not found')) {
        console.log('Session already terminated on server, proceeding with local cleanup');
      } else {
        // Re-throw other sign-out errors
        console.error('Error during sign out:', signOutError);
      }
    }
    
    // Show user-friendly message
    toast({
      title: "Session expired",
      description: "Please sign in again to continue.",
      variant: "destructive"
    });
    
    return true; // Indicates auth error was handled
  }
  return false; // Not an auth error
};

export const useEvents = (userId?: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['events', userId],
    queryFn: async () => {
      if (!userId) return { hosted: [], invited: [] };
      
      try {
        // Get hosted events with guest count
        const { data: hostedEvents, error: hostedError } = await supabase
          .from('events')
          .select(`
            *,
            template:templates(*),
            guests(*)
          `)
          .eq('host_id', userId)
          .order('created_at', { ascending: false });

        if (hostedError) {
          console.error('Error fetching hosted events:', hostedError);
          
          // Handle authentication errors
          const wasAuthError = await handleAuthError(hostedError, queryClient);
          if (wasAuthError) {
            throw new Error('Authentication required');
          }
          
          throw new Error('Failed to load your events');
        }

        // Transform hosted events to include guest count
        const hostedEventsWithCount = hostedEvents?.map(event => ({
          ...event,
          guests: Array.isArray(event.guests) ? event.guests : []
        })) || [];

        // Get profile to find mobile number
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('mobile_number')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.warn('Error fetching profile:', profileError);
          
          // Handle authentication errors for profile fetch
          const wasAuthError = await handleAuthError(profileError, queryClient);
          if (wasAuthError) {
            throw new Error('Authentication required');
          }
        }

        // Get invited events with guest count
        let invitedEvents: Event[] = [];
        if (profile?.mobile_number) {
          const { data: guestData, error: guestError } = await supabase
            .from('guests')
            .select(`
              id, 
              custom_guest_id,
              event_id,
              events!inner(
                *,
                template:templates(*),
                guests(*)
              )
            `)
            .eq('mobile_number', profile.mobile_number);

          if (guestError) {
            console.warn('Error fetching invited events:', guestError);
            
            // Handle authentication errors for guest fetch
            const wasAuthError = await handleAuthError(guestError, queryClient);
            if (wasAuthError) {
              throw new Error('Authentication required');
            }
          } else if (guestData) {
            invitedEvents = guestData.map(g => ({
              ...g.events,
              guests: Array.isArray(g.events.guests) ? g.events.guests : [],
              guest_id_for_user: g.id, // Attach the current user's guest ID
              custom_guest_id_for_user: g.custom_guest_id // Attach the current user's custom guest ID
            })).filter(Boolean) as unknown as Event[];
          }
        }

        return {
          hosted: hostedEventsWithCount as unknown as Event[],
          invited: invitedEvents
        };
      } catch (error) {
        console.error('Error in useEvents:', error);
        
        // Handle authentication errors at the top level
        const wasAuthError = await handleAuthError(error, queryClient);
        if (wasAuthError) {
          throw new Error('Authentication required');
        }
        
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000, // Consider data fresh for only 1 second
    refetchInterval: 2000, // Refetch every 2 seconds
    retry: (failureCount, error: any) => {
      // Don't retry authentication errors
      if (error?.message?.includes('Authentication required') ||
          error?.message?.includes('JWT expired') ||
          error?.code === 'PGRST301' ||
          error?.status === 401) {
        return false;
      }
      
      if (error?.message?.includes('Failed to load')) {
        return failureCount < 2;
      }
      return failureCount < 3;
    },
  });
};

export const useEvent = (eventId: string, userId?: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId || !userId) {
        throw new Error('Event ID and User ID are required');
      }

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          template:templates(*),
          guests(count)
        `)
        .eq('id', eventId)
        .eq('host_id', userId)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        
        // Handle authentication errors
        const wasAuthError = await handleAuthError(error, queryClient);
        if (wasAuthError) {
          throw new Error('Authentication required');
        }
        
        if (error.code === 'PGRST116') {
          throw new Error('Event not found or access denied');
        }
        throw new Error('Failed to load event details');
      }
      return data as unknown as Event;
    },
    enabled: !!eventId && !!userId,
    retry: (failureCount, error: any) => {
      // Don't retry authentication errors
      if (error?.message?.includes('Authentication required') ||
          error?.message?.includes('JWT expired') ||
          error?.code === 'PGRST301' ||
          error?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: {
      name: string;
      template_id: string;
      details: Record<string, any>;
      page_name: string;
      host_id: string;
    }) => {
      // Validate required fields
      if (!eventData.name?.trim()) {
        throw new Error('Event name is required');
      }
      if (!eventData.template_id) {
        throw new Error('Template selection is required');
      }
      if (!eventData.host_id) {
        throw new Error('User authentication required');
      }

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating event:', error);
        
        // Handle authentication errors
        const wasAuthError = await handleAuthError(error, queryClient);
        if (wasAuthError) {
          throw new Error('Authentication required');
        }
        
        throw new Error('Failed to create event. Please try again.');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({
        title: "Event created successfully!",
        description: "You can now add guests and share invitations."
      });
    },
    onError: (error: any) => {
      console.error('Create event mutation error:', error);
      
      // Don't show error toast for authentication errors as they're handled elsewhere
      if (!error.message?.includes('Authentication required')) {
        toast({
          title: "Error creating event",
          description: error.message || "An unexpected error occurred",
          variant: "destructive"
        });
      }
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: Partial<Omit<Event, 'id' | 'created_at' | 'host_id'>> }) => {
      console.log('useUpdateEvent mutationFn called with:', { eventId, data });
      
      const { data: updatedData, error } = await supabase
        .from('events')
        .update(data as any) // Using 'as any' because Supabase types can be tricky with partials on JSONB
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Error updating event in database:', error);
        
        // Handle authentication errors
        const wasAuthError = await handleAuthError(error, queryClient);
        if (wasAuthError) {
          throw new Error('Authentication required');
        }
        
        throw new Error('Failed to update event. Please try again.');
      }
      
      console.log('Event updated successfully in database:', updatedData);
      return updatedData;
    },
    onSuccess: (data) => {
      console.log('[useUpdateEvent] Update successful, data returned:', data);
      
      // Force refetch the specific event query immediately
      if (data) {
        queryClient.setQueryData(['event', data.id], data);
        queryClient.invalidateQueries({ queryKey: ['event', data.id] });
      }
      
      // Also invalidate the general events list
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      // Force an immediate refetch of all event-related queries
      queryClient.refetchQueries({ queryKey: ['event'] });
      
      console.log('[useUpdateEvent] Query invalidation completed');
    },
    onError: (error: any) => {
      console.error('[useUpdateEvent] Update failed with error:', error);
      
      // Don't show error toast for authentication errors as they're handled elsewhere
      if (!error.message?.includes('Authentication required')) {
        toast({
          title: "Error updating event",
          description: error.message || "An unexpected error occurred",
          variant: "destructive"
        });
      }
    },
  });
};