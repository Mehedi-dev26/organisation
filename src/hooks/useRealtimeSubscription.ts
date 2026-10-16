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
  const queryKeySerialized = JSON.stringify(queryKey);

  useEffect(() => {
    const parsedQueryKey: string[] = JSON.parse(queryKeySerialized);
    const channelName = `realtime-${table}-${parsedQueryKey.join('-')}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: parsedQueryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKeySerialized, queryClient]);
};

// Multi-table subscription hook for dashboards
export const useMultiTableRealtimeSubscription = (tables: { table: TableName; queryKeys: string[][] }[]) => {
  const queryClient = useQueryClient();
  const tablesSerialized = JSON.stringify(tables);

  useEffect(() => {
    const parsedTables: { table: TableName; queryKeys: string[][] }[] = JSON.parse(tablesSerialized);
    const channels = parsedTables.map(({ table, queryKeys }) => {
      const channel = supabase
        .channel(`realtime-multi-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          () => {
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
  }, [tablesSerialized, queryClient]);
};
