import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Template } from '@/types';
import { useCallback } from 'react';

export const useTemplateCache = () => {
  const queryClient = useQueryClient();

  // Enhanced template query with aggressive caching
  const templatesQuery = useQuery({
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
    staleTime: 30 * 60 * 1000, // 30 minutes - much longer for templates
    gcTime: 60 * 60 * 1000, // 1 hour in cache
    retry: 3,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
  });

  // Get template by ID instantly from cache
  const getTemplateById = useCallback((templateId: string): Template | undefined => {
    const templates = queryClient.getQueryData<Template[]>(['templates']);
    return templates?.find(t => t.id === templateId);
  }, [queryClient]);

  // Get all templates instantly from cache
  const getTemplates = useCallback((): Template[] | undefined => {
    return queryClient.getQueryData<Template[]>(['templates']);
  }, [queryClient]);

  // Preload templates in background (non-blocking)
  const preloadTemplates = useCallback(() => {
    const cachedTemplates = queryClient.getQueryData<Template[]>(['templates']);
    if (!cachedTemplates) {
      // Prefetch in background with low priority
      queryClient.prefetchQuery({
        queryKey: ['templates'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('templates')
            .select('*')
            .order('created_at', { ascending: true });

          if (error) throw new Error('Failed to load templates');
          return data as Template[];
        },
        staleTime: 30 * 60 * 1000,
      });
    }
  }, [queryClient]);

  return {
    // React Query results for loading states
    templates: templatesQuery.data,
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    
    // Instant access functions
    getTemplateById,
    getTemplates,
    preloadTemplates,
    
    // Check if templates are cached
    isCached: !!queryClient.getQueryData(['templates']),
  };
};