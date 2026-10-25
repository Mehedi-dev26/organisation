import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import defaultLogo from '@/assets/logo.png';
import defaultLogoRound from '@/assets/logo-round.png';

const STORAGE_KEY = 'batighor_site_logo_url';

export const useSiteLogo = () => {
  const queryClient = useQueryClient();

  // Read synchronously from localStorage to prevent visual flicker on initial load
  const [cachedLogo, setCachedLogo] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && stored.trim() ? stored.trim() : defaultLogo;
    } catch {
      return defaultLogo;
    }
  });

  const { data: logoUrl = cachedLogo, refetch } = useQuery({
    queryKey: ['site-logo'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'site_logo')
          .maybeSingle();

        if (error) {
          console.warn('Error fetching site_logo from settings:', error);
          return cachedLogo || defaultLogo;
        }

        const url = (data?.value as any)?.logo_url;
        if (url && typeof url === 'string' && url.trim()) {
          const cleanUrl = url.trim();
          try {
            localStorage.setItem(STORAGE_KEY, cleanUrl);
          } catch {}
          setCachedLogo(cleanUrl);
          return cleanUrl;
        }

        return defaultLogo;
      } catch {
        return cachedLogo || defaultLogo;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 mins
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Realtime subscription for instant multi-tab & user synchronization
  useEffect(() => {
    const channelName = `realtime-logo-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
        },
        (payload: any) => {
          if (payload?.new?.key === 'site_logo') {
            const newUrl = payload?.new?.value?.logo_url;
            if (newUrl && typeof newUrl === 'string') {
              const cleanUrl = newUrl.trim();
              try {
                localStorage.setItem(STORAGE_KEY, cleanUrl);
              } catch {}
              setCachedLogo(cleanUrl);
              queryClient.setQueryData(['site-logo'], cleanUrl);
            } else {
              refetch();
            }
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [queryClient, refetch]);

  return {
    logoUrl: logoUrl || cachedLogo || defaultLogo,
    defaultLogo,
    defaultLogoRound,
    refetchLogo: refetch,
  };
};
