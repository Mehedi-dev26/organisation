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

export const usePaymentGatewayLogos = () => {
  const queryClient = useQueryClient();

  const { data: logos = {}, isLoading, refetch } = useQuery<PaymentGatewayLogos>({
    queryKey: [SETTINGS_KEY_PAYMENT_LOGOS],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', SETTINGS_KEY_PAYMENT_LOGOS)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching payment gateway logos:', error);
          return {};
        }

        return (data?.value as PaymentGatewayLogos) || {};
      } catch (err) {
        console.warn('Error loading payment logos:', err);
        return {};
      }
    },
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });

  const saveLogosMutation = useMutation({
    mutationFn: async (updatedLogos: PaymentGatewayLogos) => {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', SETTINGS_KEY_PAYMENT_LOGOS)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            value: updatedLogos as any,
            updated_at: new Date().toISOString(),
          })
          .eq('key', SETTINGS_KEY_PAYMENT_LOGOS);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({
            key: SETTINGS_KEY_PAYMENT_LOGOS,
            value: updatedLogos as any,
            description: 'Custom logos for payment gateways (bKash, Nagad, Rocket, Upay, Cellfin, Tap, Bank)',
          });
        if (error) throw error;
      }
      return updatedLogos;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([SETTINGS_KEY_PAYMENT_LOGOS], data);
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY_PAYMENT_LOGOS] });
      queryClient.invalidateQueries({ queryKey: ['public-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
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
