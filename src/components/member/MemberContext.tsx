import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiTableRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export interface MemberData {
  id: string;
  member_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
  blood_group: string | null;
  member_type: string | null;
  status: string | null;
  joining_date: string | null;
  photo_url: string | null;
  user_id?: string | null;
}

export interface DuesData {
  id: string;
  month_year: string;
  amount: number;
  is_paid: boolean;
  paid_date: string | null;
  transaction_id: string | null;
}

interface MemberContextType {
  memberData: MemberData | null;
  memberLoading: boolean;
  refetchMember: () => void;
  duesData: DuesData[];
  duesLoading: boolean;
  refetchDues: () => void;
  bloodDonorInfo: any;
  bloodLoading: boolean;
  refetchBloodDonor: () => void;
  newsData: any[];
  newsLoading: boolean;
  paidDues: number;
  unpaidDues: number;
  totalDues: number;
  unpaidMonths: DuesData[];
  yearlyTotal: number;
  monthlyFee: number;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export const MemberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Real-time subscriptions for member portal
  const subscriptionTables = useMemo(() => [
    { table: 'members' as const, queryKeys: [['member-profile']] },
    { table: 'member_dues' as const, queryKeys: [['member-dues']] },
    { table: 'news' as const, queryKeys: [['member-news']] },
    { table: 'transactions' as const, queryKeys: [['member-dues']] },
  ], []);

  useMultiTableRealtimeSubscription(subscriptionTables);

  // Fetch member profile with email/phone fallback and auto-link user_id
  const { data: memberData, isLoading: memberLoading, refetch: refetchMember } = useQuery({
    queryKey: ['member-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // 1. Try matching by user_id
      const { data: memberByUserId } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberByUserId) {
        return memberByUserId as MemberData;
      }

      // 2. Fallback: match by email or phone digits
      const conditions: string[] = [];
      if (user.email) {
        conditions.push(`email.eq.${user.email}`);
        if (user.email.endsWith('@batighor.org')) {
          const rawPhone = user.email.replace('@batighor.org', '');
          if (rawPhone && rawPhone.length >= 10) {
            conditions.push(`phone.eq.${rawPhone}`);
          }
        }
      }
      if (user.phone) {
        conditions.push(`phone.eq.${user.phone}`);
      }

      if (conditions.length > 0) {
        const { data: fallbackMember } = await supabase
          .from('members')
          .select('*')
          .or(conditions.join(','))
          .maybeSingle();

        if (fallbackMember) {
          // Auto-link user_id for seamless future logins
          await supabase
            .from('members')
            .update({ user_id: user.id })
            .eq('id', fallbackMember.id);
          return fallbackMember as MemberData;
        }
      }

      return null;
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Fetch member dues
  const { data: duesData = [], isLoading: duesLoading, refetch: refetchDues } = useQuery({
    queryKey: ['member-dues', memberData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_dues')
        .select('*')
        .eq('member_id', memberData?.id)
        .order('month_year', { ascending: false });

      if (error) throw error;
      return (data || []) as DuesData[];
    },
    enabled: !!memberData?.id,
    refetchInterval: 5000,
  });

  // Fetch member's blood donor info
  const { data: bloodDonorInfo, isLoading: bloodLoading, refetch: refetchBloodDonor } = useQuery({
    queryKey: ['member-blood-donor-info', memberData?.member_id, memberData?.phone],
    queryFn: async () => {
      if (!memberData) return null;
      const conditions: string[] = [];
      if (memberData.member_id) conditions.push(`member_id.eq.${memberData.member_id}`);
      if (memberData.phone) conditions.push(`phone.eq.${memberData.phone}`);
      if (conditions.length === 0) return null;

      const { data, error } = await supabase
        .from('blood_donors')
        .select('*')
        .or(conditions.join(','))
        .maybeSingle();

      if (error) {
        console.warn('Error fetching donor info:', error);
        return null;
      }
      return data;
    },
    enabled: !!memberData,
    refetchInterval: 5000,
  });

  // Fetch published news
  const { data: newsData = [], isLoading: newsLoading } = useQuery({
    queryKey: ['member-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  // Calculate dues statistics
  const paidDues = duesData
    .filter((d) => d.is_paid)
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const unpaidMonths = duesData.filter((d) => !d.is_paid);
  const unpaidDues = unpaidMonths.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalDues = paidDues + unpaidDues;

  // Monthly dues standard and annual estimate
  const monthlyFee = duesData.length > 0 ? Number(duesData[0].amount) || 100 : 100;
  const yearlyTotal = monthlyFee * 12;

  const value = {
    memberData: memberData || null,
    memberLoading,
    refetchMember,
    duesData,
    duesLoading,
    refetchDues,
    bloodDonorInfo,
    bloodLoading,
    refetchBloodDonor,
    newsData,
    newsLoading,
    paidDues,
    unpaidDues,
    totalDues,
    unpaidMonths,
    yearlyTotal,
    monthlyFee,
  };

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
};

export const useMember = () => {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
};
