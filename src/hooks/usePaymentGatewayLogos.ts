import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentGatewayLogos {
  bkash?: string;
  nagad?: string;
  rocket?: string;
  upay?: string;
  cellfin?: string;
  tap?: string;
  bank?: string;
  [key: string]: string | undefined;
}

export const SETTINGS_KEY_PAYMENT_LOGOS = 'payment_gateway_logos';
const LOCAL_STORAGE_KEY = 'batighor_payment_logos';

export const usePaymentGatewayLogos = () => {
  const queryClient = useQueryClient();

  const { data: logos = {}, isLoading, refetch } = useQuery<PaymentGatewayLogos>({
    queryKey: [SETTINGS_KEY_PAYMENT_LOGOS],
    queryFn: async () => {
      // 1. Read from localStorage cache first for zero-delay UI render
      let cachedLogos: PaymentGatewayLogos = {};
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          cachedLogos = JSON.parse(stored);
        }
      } catch (e) {
        // ignore cache parse errors
      }

      // 2. Fetch authoritative database state from site_settings
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', SETTINGS_KEY_PAYMENT_LOGOS)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching payment gateway logos from site_settings:', error);
          return cachedLogos;
        }

        const remoteValue = (data?.value as PaymentGatewayLogos) || {};
        const merged = { ...cachedLogos, ...remoteValue };

        // Keep local cache fresh
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        } catch (e) { }

        return merged;
      } catch (err) {
        console.warn('Error loading payment logos:', err);
        return cachedLogos;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });

  const saveLogosMutation = useMutation({
    mutationFn: async (updatedLogos: PaymentGatewayLogos) => {
      // 1. Immediately cache in localStorage for instant responsiveness
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLogos));
      } catch (e) {
        console.warn('Failed to cache logos in localStorage:', e);
      }

      // 2. Atomic upsert to public.site_settings (no non-existent description column!)
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          {
            key: SETTINGS_KEY_PAYMENT_LOGOS,
            value: updatedLogos as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) {
        console.error('Database upsert failed for payment_gateway_logos:', error);
        throw error;
      }

      return updatedLogos;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([SETTINGS_KEY_PAYMENT_LOGOS], data);
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY_PAYMENT_LOGOS] });
      queryClient.invalidateQueries({ queryKey: ['public-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });

  return {
    logos,
    isLoading,
    refetch,
    saveLogos: saveLogosMutation.mutateAsync,
    isSaving: saveLogosMutation.isPending,
  };
};
