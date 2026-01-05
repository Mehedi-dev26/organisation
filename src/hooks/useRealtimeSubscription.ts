import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'members' | 'news' | 'events' | 'committee_members' | 'transactions' | 'member_dues' | 'gallery_images' | 'cashiers' | 'activity_logs';

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  queryKey: string[];
}

export const useRealtimeSubscription = ({ table, queryKey }: UseRealtimeSubscriptionOptions) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`Realtime update for ${table}:`, payload);
          // Invalidate the query to refetch data
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKey, queryClient]);
};

// Multi-table subscription hook for dashboards
export const useMultiTableRealtimeSubscription = (tables: { table: TableName; queryKeys: string[][] }[]) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels = tables.map(({ table, queryKeys }) => {
      const channel = supabase
        .channel(`realtime-multi-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            console.log(`Realtime update for ${table}:`, payload);
            // Invalidate all related queries
            queryKeys.forEach(queryKey => {
              queryClient.invalidateQueries({ queryKey });
            });
          }
        )
        .subscribe();
      
      return channel;
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [tables, queryClient]);
};
