import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Eye,
  AlertTriangle,
  CreditCard,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  Printer,
  RotateCcw,
  Edit,
  Trash2
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import TransactionVoucher from '@/components/admin/TransactionVoucher';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { safeFormatDate } from '@/lib/dateUtils';
import { sendTemplatedSms } from '@/services/smsService';
import { 
  getPendingMagicPayments, 
  getStoredMagicLinks, 
  updateMagicPaymentStatus 
} from '@/lib/magicLinkUtils';

interface PendingPayment {
  id: string;
  member_id: string;
  month_year: string;
  amount: number;
  is_paid: boolean;
  transaction_id: string | null;
  payment_method: string | null;
  payment_status: string;
  submitted_at: string | null;
  verified_at?: string | null;
  rejection_reason: string | null;
  isMagicLink?: boolean;
  magicToken?: string | null;
  senderAccount?: string | null;
  members: {
    id: string;
    member_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

// Payment method labels for display
const paymentMethodLabels: Record<string, { bn: string; en: string }> = {
  bkash: { bn: 'বিকাশ', en: 'bKash' },
  nagad: { bn: 'নগদ', en: 'Nagad' },
  rocket: { bn: 'রকেট', en: 'Rocket' },
  bank: { bn: 'ব্যাংক', en: 'Bank' },
  cash: { bn: 'নগদ টাকা', en: 'Cash' },
  mobile_banking: { bn: 'মোবাইল ব্যাংকিং', en: 'Mobile Banking' },
};

const PaymentVerification = () => {
  const { language } = useLanguage();
  const { isAdmin, isCashier, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [recentFilter, setRecentFilter] = useState<'all' | 'approved' | 'rejected'>('all');

  // Voucher print state
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [voucherTransaction, setVoucherTransaction] = useState<any>(null);
  const voucherRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: voucherRef,
    documentTitle: `Voucher-${voucherTransaction?.payment_reference || 'receipt'}`,
  });

  // Reversal / Revoke Dialog State
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [revokePayment, setRevokePayment] = useState<PendingPayment | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Edit Payment Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<PendingPayment | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMonth, setEditMonth] = useState<string>('');
  const [editTrxId, setEditTrxId] = useState<string>('');
  const [editMethod, setEditMethod] = useState<string>('bkash');

  // Delete Payment Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePayment, setDeletePayment] = useState<PendingPayment | null>(null);

  // Real-time subscription on member dues
  useRealtimeSubscription({ table: 'member_dues', queryKey: ['pending-payments'] });
  useRealtimeSubscription({ table: 'member_dues', queryKey: ['recent-verified-payments'] });

  // Fetch pending payments (Combining member_dues table AND magic_payment_links)
  const { data: pendingPayments = [], isLoading, refetch: refetchPending, isFetching } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      // 1. Fetch from member_dues table
      const { data: duesData, error: duesError } = await supabase
        .from('member_dues')
        .select(`
          *,
          members (
            id,
            member_id,
            full_name,
            email,
            phone
          )
        `)
        .eq('payment_status', 'submitted')
        .eq('is_paid', false)
        .order('submitted_at', { ascending: true });
      
      if (duesError) console.warn('Fetch member_dues notice:', duesError);
      const list: PendingPayment[] = (duesData as PendingPayment[]) || [];

      // 2. Fetch submitted magic link payments from site_settings
      const magicList = await getPendingMagicPayments();

      for (const m of magicList) {
        // Check if already in list by dueId, transactionId, or memberId+month
        const existing = list.find((d) => 
          (m.dueId && d.id === m.dueId) || 
          (m.transactionId && d.transaction_id === m.transactionId) ||
          (d.member_id === m.memberId && d.month_year === m.month)
        );

        if (existing) {
          if (!existing.transaction_id && m.transactionId) {
            existing.transaction_id = m.transactionId;
          }
          if (!existing.payment_method && m.paymentMethod) {
            existing.payment_method = m.paymentMethod;
          }
          existing.isMagicLink = true;
          existing.magicToken = m.token;
          existing.senderAccount = m.senderAccount;
        } else {
          // Add magic submission to pending list
          list.push({
            id: m.dueId || `magic-${m.token}`,
            member_id: m.memberId,
            month_year: m.month,
            amount: m.amount,
            is_paid: false,
            transaction_id: m.transactionId || null,
            payment_method: m.paymentMethod || 'bkash',
            payment_status: 'submitted',
            submitted_at: m.usedAt || m.createdAt,
            rejection_reason: null,
            isMagicLink: true,
            magicToken: m.token,
            senderAccount: m.senderAccount,
            members: {
              id: m.memberId,
              member_id: m.memberDisplayId,
              full_name: m.memberName,
              phone: m.memberPhone,
              email: null,
            },
          });

          // Sync into member_dues table in the background if dueId exists
          if (m.dueId) {
            supabase
              .from('member_dues')
              .update({
                transaction_id: m.transactionId,
                payment_method: m.paymentMethod,
                payment_status: 'submitted',
                submitted_at: m.usedAt || new Date().toISOString(),
              })
              .eq('id', m.dueId)
              .then(() => {})
              .catch(() => {});
          }
        }
      }

      return list;
    },
    enabled: isAdmin || isCashier,
    refetchInterval: 10000, // Live poll every 10s
  });

  // Fetch verified payment history (Combining member_dues AND magic_payment_links)
  const { data: recentPayments = [], refetch: refetchRecent } = useQuery({
    queryKey: ['recent-verified-payments'],
    queryFn: async () => {
      const { data: dbData, error } = await supabase
        .from('member_dues')
        .select(`
          *,
          members (
            id,
            member_id,
            full_name,
            email,
            phone
          )
        `)
        .in('payment_status', ['approved', 'rejected'])
        .limit(40);
      
      if (error) console.warn('Fetch recent verified notice:', error);
      const list: PendingPayment[] = (dbData as PendingPayment[]) || [];

      // Also merge verified magic links
      try {
        const store = await getStoredMagicLinks();
        for (const [token, m] of Object.entries(store)) {
          if (m.isUsed && (m.payment_status === 'approved' || m.payment_status === 'rejected')) {
            const alreadyInList = list.some((d) => 
              (m.dueId && d.id === m.dueId) || 
              (m.transactionId && d.transaction_id === m.transactionId)
            );

            if (!alreadyInList) {
              list.push({
                id: m.dueId || `magic-${token}`,
                member_id: m.memberId,
                month_year: m.month,
                amount: m.amount,
                is_paid: m.payment_status === 'approved',
                transaction_id: m.transactionId || null,
                payment_method: m.paymentMethod || 'bkash',
                payment_status: m.payment_status,
                submitted_at: m.usedAt || m.createdAt,
                verified_at: m.verifiedAt || m.usedAt,
                rejection_reason: m.rejectionReason || null,
                isMagicLink: true,
                magicToken: token,
                members: {
                  id: m.memberId,
                  member_id: m.memberDisplayId,
                  full_name: m.memberName,
                  phone: m.memberPhone,
                  email: null,
                },
              });
            }
          }
        }
      } catch (mErr) {
        console.warn('Magic store read warning:', mErr);
      }

      // Sort by verification date descending
      list.sort((a, b) => {
        const dateA = new Date(a.verified_at || a.submitted_at || 0).getTime();
        const dateB = new Date(b.verified_at || b.submitted_at || 0).getTime();
        return dateB - dateA;
      });

      return list;
    },
    enabled: isAdmin || isCashier,
    refetchInterval: 15000,
  });

  // Copy transaction ID to clipboard
  const handleCopyTrxId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'কপি হয়েছে!',
      description: id,
    });
  };

  // Approve payment mutation
  const approveMutation = useMutation({
    mutationFn: async (payment: PendingPayment) => {
      const cleanTrx = payment.transaction_id || `TRX-${Date.now().toString().slice(-8)}`;

      // 1. Create a transaction record
      let txnId = cleanTrx;
      try {
        const { data: txnData } = await supabase
          .from('transactions')
          .insert({
            type: 'member_fee',
            amount: payment.amount,
            member_id: payment.member_id,
            month_year: payment.month_year,
            transaction_date: new Date().toISOString().split('T')[0],
            payment_method: payment.payment_method || 'bkash',
            payment_reference: cleanTrx,
            description_bn: `${payment.month_year} মাসের চাঁদা (${payment.members?.full_name || 'সদস্য'})`,
            description_en: `Monthly dues for ${payment.month_year} (${payment.members?.full_name || 'Member'})`,
            created_by: user?.id || null,
          })
          .select()
          .maybeSingle();

        if (txnData?.id) {
          txnId = txnData.id;
        }
      } catch (tErr) {
        console.warn('Transaction record creation notice:', tErr);
      }

      // 2. Update the dues record in member_dues
      if (payment.id && !payment.id.startsWith('magic-')) {
        await supabase
          .from('member_dues')
          .update({
            is_paid: true,
            paid_date: new Date().toISOString().split('T')[0],
            payment_status: 'approved',
            verified_by: user?.id || null,
            verified_at: new Date().toISOString(),
            transaction_id: cleanTrx,
          })
          .eq('id', payment.id);
      } else if (payment.member_id) {
        // Find existing due for this member and month or insert
        const { data: existingDue } = await supabase
          .from('member_dues')
          .select('id')
          .eq('member_id', payment.member_id)
          .eq('month_year', payment.month_year)
          .maybeSingle();

        if (existingDue) {
          await supabase
            .from('member_dues')
            .update({
              is_paid: true,
              paid_date: new Date().toISOString().split('T')[0],
              payment_status: 'approved',
              verified_by: user?.id || null,
              verified_at: new Date().toISOString(),
              transaction_id: cleanTrx,
            })
            .eq('id', existingDue.id);
        } else {
          await supabase.from('member_dues').insert({
            member_id: payment.member_id,
            month_year: payment.month_year,
            amount: payment.amount,
            is_paid: true,
            paid_date: new Date().toISOString().split('T')[0],
            payment_status: 'approved',
            verified_by: user?.id || null,
            verified_at: new Date().toISOString(),
            transaction_id: cleanTrx,
            payment_method: payment.payment_method,
          });
        }
      }

      // 3. Update magic link status in site_settings
      if (payment.magicToken) {
        await updateMagicPaymentStatus(payment.magicToken, 'approved');
      } else {
        const store = await getStoredMagicLinks();
        for (const [tok, item] of Object.entries(store)) {
          if (item.dueId === payment.id || (payment.transaction_id && item.transactionId === payment.transaction_id)) {
            await updateMagicPaymentStatus(tok, 'approved');
          }
        }
      }

      // 4. Log activity
      try {
        await supabase.from('activity_logs').insert({
          user_id: user?.id || '',
          user_role: isAdmin ? 'admin' : 'cashier',
          action_type: 'payment_approved',
          entity_type: 'member_dues',
          entity_id: payment.id,
          description_bn: `${payment.members?.full_name} এর ${payment.month_year} মাসের চাঁদা অনুমোদিত`,
          description_en: `Approved ${payment.month_year} dues for ${payment.members?.full_name}`,
          metadata: { transaction_id: cleanTrx, amount: payment.amount },
        });
      } catch {}

      // 5. Send automated approval SMS
      if (payment.members?.phone) {
        try {
          sendTemplatedSms(
            'payment_approved',
            payment.members.phone,
            payment.members.full_name,
            {
              name: payment.members.full_name,
              member_id: payment.members.member_id || '',
              amount: payment.amount,
              month: payment.month_year,
              trx_id: cleanTrx,
              payment_method: payment.payment_method || 'bKash',
              org_name: 'সময়ের বাতিঘর',
            },
            'payment_approved',
            payment.member_id
          ).catch((e) => console.warn('Payment approval SMS background error:', e));
        } catch (smsErr) {
          console.warn('Payment approval SMS trigger error:', smsErr);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['recent-verified-payments'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-badge-pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['notice-pending-payments'] });
      setIsApproveDialogOpen(false);
      setSelectedPayment(null);
      toast({
        title: language === 'bn' ? 'অনুমোদিত!' : 'Approved!',
        description: language === 'bn' 
          ? 'পেমেন্ট সফলভাবে অনুমোদিত হয়েছে এবং সদস্যের অ্যাকাউন্টে জমা হয়েছে।' 
          : 'Payment has been approved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject payment mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ payment, reason }: { payment: PendingPayment; reason: string }) => {
      // 1. Update member_dues table
      if (payment.id && !payment.id.startsWith('magic-')) {
        await supabase
          .from('member_dues')
          .update({
            payment_status: 'rejected',
            rejection_reason: reason,
            verified_by: user?.id || null,
            verified_at: new Date().toISOString(),
          })
          .eq('id', payment.id);
      }

      // 2. Update magic link status in site_settings
      if (payment.magicToken) {
        await updateMagicPaymentStatus(payment.magicToken, 'rejected', reason);
      } else {
        const store = await getStoredMagicLinks();
        for (const [tok, item] of Object.entries(store)) {
          if (item.dueId === payment.id || (payment.transaction_id && item.transactionId === payment.transaction_id)) {
            await updateMagicPaymentStatus(tok, 'rejected', reason);
          }
        }
      }

      // 3. Log activity
      try {
        await supabase.from('activity_logs').insert({
          user_id: user?.id || '',
          user_role: isAdmin ? 'admin' : 'cashier',
          action_type: 'payment_rejected',
          entity_type: 'member_dues',
          entity_id: payment.id,
          description_bn: `${payment.members?.full_name} এর ${payment.month_year} মাসের চাঁদা প্রত্যাখ্যাত`,
          description_en: `Rejected ${payment.month_year} dues for ${payment.members?.full_name}`,
          metadata: { transaction_id: payment.transaction_id, reason },
        });
      } catch {}

      // 4. Send automated rejection SMS
      if (payment.members?.phone) {
        try {
          sendTemplatedSms(
            'payment_rejected',
            payment.members.phone,
            payment.members.full_name,
            {
              name: payment.members.full_name,
              member_id: payment.members.member_id || '',
              amount: payment.amount,
              month: payment.month_year,
              reject_reason: reason || 'ভুল বা অসম্পূর্ণ পেমেন্ট তথ্য',
              payment_link: 'https://samoyerbatighor.pro.bd/pay',
              org_name: 'সময়ের বাতিঘর',
            },
            'payment_rejected',
            payment.member_id
          ).catch((e) => console.warn('Payment rejection SMS background error:', e));
        } catch (smsErr) {
          console.warn('Payment rejection SMS trigger error:', smsErr);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['recent-verified-payments'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      queryClient.invalidateQueries({ queryKey: ['admin-badge-pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['notice-pending-payments'] });
      setIsRejectDialogOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
      toast({
        title: language === 'bn' ? 'প্রত্যাখ্যাত!' : 'Rejected!',
        description: language === 'bn' 
          ? 'পেমেন্ট প্রত্যাখ্যান করা হয়েছে।' 
          : 'Payment has been rejected.',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Open & Synthesize Voucher for Printing
  const handleOpenVoucher = async (payment: PendingPayment) => {
    let txnRecord: any = null;
    try {
      if (payment.transaction_id) {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .or(`payment_reference.eq.${payment.transaction_id},id.eq.${payment.transaction_id}`)
          .maybeSingle();
        if (data) txnRecord = data;
      }

      if (!txnRecord && payment.member_id && payment.month_year) {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('member_id', payment.member_id)
          .eq('month_year', payment.month_year)
          .maybeSingle();
        if (data) txnRecord = data;
      }
    } catch (e) {
      console.warn('Voucher query warning:', e);
    }

    if (!txnRecord) {
      txnRecord = {
        id: payment.id,
        type: 'member_fee',
        amount: payment.amount,
        payment_method: payment.payment_method || 'bkash',
        payment_reference: payment.transaction_id || `TRX-${payment.id.slice(0, 8).toUpperCase()}`,
        transaction_date: payment.verified_at ? payment.verified_at.split('T')[0] : new Date().toISOString().split('T')[0],
        month_year: payment.month_year,
        description_bn: `${payment.month_year} মাসের সদস্য চাঁদা (${payment.members?.full_name || 'সদস্য'})`,
        description_en: `Monthly dues for ${payment.month_year}`,
        members: { full_name: payment.members?.full_name || 'সদস্য' },
      };
    } else {
      if (!txnRecord.members) {
        txnRecord.members = { full_name: payment.members?.full_name || 'সদস্য' };
      }
    }

    setVoucherTransaction(txnRecord);
    setIsVoucherOpen(true);
  };

  // Revoke an accidental/incorrect approval (Rolls back financial management balance & reverts due)
  const revokeApprovalMutation = useMutation({
    mutationFn: async ({ payment, reason }: { payment: PendingPayment; reason?: string }) => {
      // 1. Delete associated transaction from transactions table
      try {
        if (payment.transaction_id) {
          await supabase
            .from('transactions')
            .delete()
            .or(`payment_reference.eq.${payment.transaction_id},id.eq.${payment.transaction_id}`);
        }
        if (payment.member_id && payment.month_year) {
          await supabase
            .from('transactions')
            .delete()
            .eq('type', 'member_fee')
            .eq('member_id', payment.member_id)
            .eq('month_year', payment.month_year);
        }
      } catch (txnErr) {
        console.warn('Rollback transaction non-fatal notice:', txnErr);
      }

      // 2. Revert member_dues to unpaid / rejected
      if (payment.id && !payment.id.startsWith('magic-')) {
        await supabase
          .from('member_dues')
          .update({
            is_paid: false,
            payment_status: 'rejected',
            rejection_reason: reason || 'অ্যাডমিন কর্তৃক অনুমোদন বাতিল করা হয়েছে',
            paid_date: null,
            verified_by: user?.id || null,
            verified_at: new Date().toISOString(),
          })
          .eq('id', payment.id);
      } else if (payment.member_id && payment.month_year) {
        await supabase
          .from('member_dues')
          .update({
            is_paid: false,
            payment_status: 'rejected',
            rejection_reason: reason || 'অ্যাডমিন কর্তৃক অনুমোদন বাতিল করা হয়েছে',
            paid_date: null,
            verified_by: user?.id || null,
            verified_at: new Date().toISOString(),
          })
          .eq('member_id', payment.member_id)
          .eq('month_year', payment.month_year);
      }

      // 3. Revert magic link status in site_settings
      if (payment.magicToken) {
        await updateMagicPaymentStatus(payment.magicToken, 'rejected', reason || 'অনুমোদন প্রত্যাহার');
      } else {
        const store = await getStoredMagicLinks();
        for (const [tok, item] of Object.entries(store)) {
          if (item.dueId === payment.id || (payment.transaction_id && item.transactionId === payment.transaction_id)) {
            await updateMagicPaymentStatus(tok, 'rejected', reason || 'অনুমোদন প্রত্যাহার');
          }
        }
      }

      // 4. Log activity
      try {
        await supabase.from('activity_logs').insert({
          user_id: user?.id || '',
          user_role: isAdmin ? 'admin' : 'cashier',
          action_type: 'payment_revoked',
          entity_type: 'member_dues',
          entity_id: payment.id,
          description_bn: `${payment.members?.full_name} এর ${payment.month_year} মাসের চাঁদার অনুমোদন বাতিল ও হিসাব সমন্বয়`,
          description_en: `Revoked payment approval for ${payment.members?.full_name}`,
          metadata: { transaction_id: payment.transaction_id, amount: payment.amount, reason },
        });
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-verified-payments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      queryClient.invalidateQueries({ queryKey: ['admin-badge-pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['notice-pending-payments'] });
      setIsRevokeDialogOpen(false);
      setRevokePayment(null);
      setRevokeReason('');
      toast({
        title: language === 'bn' ? 'অনুমোদন বাতিল করা হয়েছে' : 'Approval Revoked',
        description: language === 'bn' 
          ? 'পেমেন্টের অনুমোদন সফলভাবে বাতিল এবং আর্থিক হিসাব সমন্বয় করা হয়েছে।' 
          : 'Payment approval has been revoked and accounts adjusted.',
      });
    },
    onError: (err: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message || 'অনুমোদন বাতিল করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    },
  });

  // Edit verified payment details & sync with finance records
  const editPaymentMutation = useMutation({
    mutationFn: async ({
      payment,
      newAmount,
      newMonth,
      newTrxId,
      newMethod,
    }: {
      payment: PendingPayment;
      newAmount: number;
      newMonth: string;
      newTrxId: string;
      newMethod: string;
    }) => {
      // 1. Update in transactions table
      try {
        if (payment.transaction_id) {
          await supabase
            .from('transactions')
            .update({
              amount: newAmount,
              month_year: newMonth,
              payment_reference: newTrxId,
              payment_method: newMethod,
            })
            .or(`payment_reference.eq.${payment.transaction_id},id.eq.${payment.transaction_id}`);
        } else if (payment.member_id) {
          await supabase
            .from('transactions')
            .update({
              amount: newAmount,
              month_year: newMonth,
              payment_reference: newTrxId,
              payment_method: newMethod,
            })
            .eq('type', 'member_fee')
            .eq('member_id', payment.member_id)
            .eq('month_year', payment.month_year);
        }
      } catch (tErr) {
        console.warn('Update transaction notice:', tErr);
      }

      // 2. Update member_dues table
      if (payment.id && !payment.id.startsWith('magic-')) {
        await supabase
          .from('member_dues')
          .update({
            amount: newAmount,
            month_year: newMonth,
            transaction_id: newTrxId,
            payment_method: newMethod,
          })
          .eq('id', payment.id);
      } else if (payment.member_id) {
        await supabase
          .from('member_dues')
          .update({
            amount: newAmount,
            month_year: newMonth,
            transaction_id: newTrxId,
            payment_method: newMethod,
          })
          .eq('member_id', payment.member_id)
          .eq('month_year', payment.month_year);
      }

      // 3. Update magic link record if applicable
      try {
        const store = await getStoredMagicLinks();
        let changed = false;
        for (const [tok, item] of Object.entries(store)) {
          if (tok === payment.magicToken || item.dueId === payment.id || (payment.transaction_id && item.transactionId === payment.transaction_id)) {
            item.amount = newAmount;
            item.month = newMonth;
            item.transactionId = newTrxId;
            item.paymentMethod = newMethod;
            changed = true;
          }
        }
        if (changed) {
          await supabase
            .from('site_settings')
            .upsert({ key: 'magic_payment_links', value: store as any }, { onConflict: 'key' });
        }
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-verified-payments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      setIsEditDialogOpen(false);
      setEditPayment(null);
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? 'পেমেন্ট তথ্য সফলভাবে সম্পাদিত এবং হিসাব সমন্বয় করা হয়েছে।' 
          : 'Payment details edited successfully.',
      });
    },
    onError: (err: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message || 'পেমেন্ট এডিট করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    },
  });

  // Delete payment record & rollback finance balances
  const deletePaymentMutation = useMutation({
    mutationFn: async (payment: PendingPayment) => {
      // 1. Delete associated transaction from transactions table
      try {
        if (payment.transaction_id) {
          await supabase
            .from('transactions')
            .delete()
            .or(`payment_reference.eq.${payment.transaction_id},id.eq.${payment.transaction_id}`);
        }
        if (payment.member_id && payment.month_year) {
          await supabase
            .from('transactions')
            .delete()
            .eq('type', 'member_fee')
            .eq('member_id', payment.member_id)
            .eq('month_year', payment.month_year);
        }
      } catch (tErr) {
        console.warn('Delete transaction notice:', tErr);
      }

      // 2. Reset or delete member_dues
      if (payment.id && !payment.id.startsWith('magic-')) {
        await supabase
          .from('member_dues')
          .update({
            is_paid: false,
            payment_status: 'unpaid',
            transaction_id: null,
            paid_date: null,
            verified_at: null,
            verified_by: null,
            submitted_at: null,
          })
          .eq('id', payment.id);
      }

      // 3. Remove or clean up magic link record in site_settings
      try {
        const store = await getStoredMagicLinks();
        let changed = false;
        for (const [tok, item] of Object.entries(store)) {
          if (tok === payment.magicToken || item.dueId === payment.id || (payment.transaction_id && item.transactionId === payment.transaction_id)) {
            delete store[tok];
            changed = true;
          }
        }
        if (changed) {
          await supabase
            .from('site_settings')
            .upsert({ key: 'magic_payment_links', value: store as any }, { onConflict: 'key' });
        }
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-verified-payments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      queryClient.invalidateQueries({ queryKey: ['admin-badge-pending-payments'] });
      setIsDeleteDialogOpen(false);
      setDeletePayment(null);
      toast({
        title: language === 'bn' ? 'মুছে ফেলা হয়েছে' : 'Deleted',
        description: language === 'bn' 
          ? 'পেমেন্ট রেকর্ড মুছে ফেলা হয়েছে এবং আর্থিক হিসাব সমন্বয় করা হয়েছে।' 
          : 'Payment record deleted and accounts adjusted.',
      });
    },
    onError: (err: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message || 'পেমেন্ট মুছতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    },
  });

  // Filter pending payments
  const filteredPayments = useMemo(() => {
    return pendingPayments.filter(payment => {
      const memberName = payment.members?.full_name?.toLowerCase() || '';
      const memberId = payment.members?.member_id?.toLowerCase() || '';
      const txnId = payment.transaction_id?.toLowerCase() || '';
      const query = searchQuery.toLowerCase().trim();
      return memberName.includes(query) || memberId.includes(query) || txnId.includes(query);
    });
  }, [pendingPayments, searchQuery]);

  // Filter verified payments
  const filteredRecentPayments = useMemo(() => {
    return recentPayments.filter(payment => {
      if (recentFilter === 'approved' && payment.payment_status !== 'approved') return false;
      if (recentFilter === 'rejected' && payment.payment_status !== 'rejected') return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const memberName = payment.members?.full_name?.toLowerCase() || '';
        const memberId = payment.members?.member_id?.toLowerCase() || '';
        const txnId = payment.transaction_id?.toLowerCase() || '';
        return memberName.includes(query) || memberId.includes(query) || txnId.includes(query);
      }
      return true;
    });
  }, [recentPayments, recentFilter, searchQuery]);

  if (!isAdmin && !isCashier) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-muted-foreground font-medium">
          {language === 'bn' ? 'এই পেজে প্রবেশের অনুমতি নেই' : 'Access denied'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'bn' ? 'পেমেন্ট যাচাইকরণ' : 'Payment Verification'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {language === 'bn' 
              ? 'ওয়েবসাইট ও ম্যাজিক লিংক থেকে জমা হওয়া বিকাশ/নগদ পেমেন্ট রিয়েলটাইমে যাচাই ও অনুমোদন করুন' 
              : 'Real-time verification and approval of member payments from portal and magic links'}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            refetchPending();
            refetchRecent();
          }}
          disabled={isFetching}
          className="rounded-xl border-border/80 text-xs font-bold gap-2 h-9 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>{language === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-[20px] border-border/60 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  {language === 'bn' ? 'অপেক্ষমাণ পেমেন্ট' : 'Pending Payments'}
                </p>
                <p className="text-2xl font-black text-amber-600">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-border/60 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  {language === 'bn' ? 'মোট অপেক্ষমাণ পরিমাণ' : 'Total Pending Amount'}
                </p>
                <p className="text-2xl font-black text-emerald-600">
                  ৳{pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-border/60 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  {language === 'bn' ? 'সাম্প্রতিক যাচাইকৃত মোট' : 'Total Verified History'}
                </p>
                <p className="text-2xl font-black text-blue-600">{recentPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Table Card */}
      <Card className="rounded-[22px] border-border/60 shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-3.5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>{language === 'bn' ? 'অপেক্ষমাণ পেমেন্ট তালিকা' : 'Pending Payments for Verification'}</span>
                {pendingPayments.length > 0 && (
                  <Badge className="bg-amber-600 text-white font-bold text-xs px-2 py-0.5 rounded-full ml-1">
                    {pendingPayments.length} টি
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {language === 'bn' 
                  ? 'বিকাশ, নগদ বা রকেট ট্রানজেকশন আইডি যাচাই করে অনুমোদন বা প্রত্যাখ্যান করুন' 
                  : 'Verify transaction IDs and approve or reject submissions'}
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={language === 'bn' ? 'সদস্য, ফোন বা TrxID খুঁজুন...' : 'Search by member, phone or TrxID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
              <p className="text-xs text-muted-foreground">{language === 'bn' ? 'পেমেন্ট লোড হচ্ছে...' : 'Loading payments...'}</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-14 space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-foreground">
                  {language === 'bn' ? 'কোন অপেক্ষমাণ পেমেন্ট নেই!' : 'No pending payments!'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'bn' ? 'সকল পেমেন্ট যাচাই সম্পন্ন হয়েছে।' : 'All submissions are currently processed.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-x-auto shadow-2xs">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'সদস্য' : 'Member'}</TableHead>
                    <TableHead>{language === 'bn' ? 'মাস' : 'Month'}</TableHead>
                    <TableHead>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead>{language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Method'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID'}</TableHead>
                    <TableHead>{language === 'bn' ? 'জমার সময়' : 'Submitted'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-xs sm:text-sm text-foreground">{payment.members?.full_name || 'নামহীন সদস্য'}</p>
                            {payment.isMagicLink && (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 text-[10px] py-0 px-1.5 font-bold gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-[#9BD038]" />
                                <span>ম্যাজিক লিংক</span>
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{payment.members?.member_id}</p>
                          {payment.members?.phone && (
                            <p className="text-[11px] text-muted-foreground font-mono">{payment.members.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{payment.month_year}</TableCell>
                      <TableCell className="font-extrabold text-sm text-foreground">৳{payment.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          payment.payment_method === 'bkash' ? 'border-pink-500 text-pink-600 bg-pink-50 dark:bg-pink-950/30' :
                          payment.payment_method === 'nagad' ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/30' :
                          payment.payment_method === 'rocket' ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/30' :
                          payment.payment_method === 'bank' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30' :
                          'border-gray-500 text-gray-600'
                        }>
                          {payment.payment_method ? (paymentMethodLabels[payment.payment_method]?.[language] || payment.payment_method) : (language === 'bn' ? 'উল্লেখ নেই' : 'N/A')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="bg-muted px-2 py-1 rounded-md text-xs font-mono font-bold text-foreground">
                            {payment.transaction_id || 'N/A'}
                          </code>
                          {payment.transaction_id && (
                            <button
                              type="button"
                              onClick={() => handleCopyTrxId(payment.transaction_id!)}
                              className="text-muted-foreground hover:text-foreground p-1 rounded"
                              title="কপি করুন"
                            >
                              {copiedId === payment.transaction_id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {safeFormatDate(payment.submitted_at, 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 px-3 cursor-pointer shadow-xs gap-1"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsApproveDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'অনুমোদন' : 'Approve'}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="font-bold text-xs rounded-xl h-8 px-2.5 cursor-pointer shadow-xs gap-1"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Verified Payments Card (Always visible, Never automatically deletes) */}
      <Card className="rounded-[22px] border-border/60 shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-3.5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>{language === 'bn' ? 'সাম্প্রতিক যাচাইকৃত ইতিহাস (Verified History)' : 'Recently Verified History'}</span>
                <Badge variant="outline" className="text-xs font-bold ml-1">
                  {recentPayments.length} টি রেকর্ড
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {language === 'bn' 
                  ? 'ইতিপূর্বে অনুমোদিত এবং প্রত্যাখ্যাত সকল পেমেন্টের স্থায়ী হিস্ট্রি রেকর্ড' 
                  : 'Permanent history log of all approved and rejected payments'}
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setRecentFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  recentFilter === 'all' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                }`}
              >
                {language === 'bn' ? 'সকল' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setRecentFilter('approved')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  recentFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground'
                }`}
              >
                {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
              </button>
              <button
                type="button"
                onClick={() => setRecentFilter('rejected')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  recentFilter === 'rejected' ? 'bg-red-600 text-white shadow-xs' : 'text-muted-foreground'
                }`}
              >
                {language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {filteredRecentPayments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs font-medium">
              <Eye className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <span>{language === 'bn' ? 'কোনো যাচাইকৃত পেমেন্ট রেকর্ড নেই' : 'No verified records found'}</span>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-x-auto shadow-2xs">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'সদস্য' : 'Member'}</TableHead>
                    <TableHead>{language === 'bn' ? 'মাস' : 'Month'}</TableHead>
                    <TableHead>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead>{language === 'bn' ? 'মাধ্যম' : 'Method'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID)' : 'TrxID'}</TableHead>
                    <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                    <TableHead>{language === 'bn' ? 'যাচাইয়ের তারিখ' : 'Verified Date'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecentPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div>
                          <p className="font-bold text-xs text-foreground">{payment.members?.full_name || 'সদস্য'}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">{payment.members?.member_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{payment.month_year}</TableCell>
                      <TableCell className="font-bold text-xs">৳{payment.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {payment.payment_method ? (paymentMethodLabels[payment.payment_method]?.[language] || payment.payment_method) : 'bKash'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono font-semibold">
                          {payment.transaction_id || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        {payment.payment_status === 'approved' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 font-bold text-[11px]">
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                            {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="font-bold text-[11px]">
                            <XCircle className="w-3 h-3 mr-1" />
                            {language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {safeFormatDate(payment.verified_at || payment.submitted_at, 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. Money Receipt / Voucher Print */}
                          {payment.payment_status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-bold gap-1 cursor-pointer"
                              onClick={() => handleOpenVoucher(payment)}
                              title={language === 'bn' ? 'রশিদ / ভাউচার দেখুন ও প্রিন্ট করুন' : 'View & Print Receipt'}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{language === 'bn' ? 'রশিদ' : 'Receipt'}</span>
                            </Button>
                          )}

                          {/* 2. Revoke Approval / Cancel */}
                          {payment.payment_status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-bold gap-1 cursor-pointer"
                              onClick={() => {
                                setRevokePayment(payment);
                                setRevokeReason('');
                                setIsRevokeDialogOpen(true);
                              }}
                              title={language === 'bn' ? 'অনুমোদন বাতিল ও আর্থিক হিসাব সমন্বয়' : 'Revoke Approval'}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{language === 'bn' ? 'বাতিল' : 'Revoke'}</span>
                            </Button>
                          )}

                          {/* 3. Edit Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                            onClick={() => {
                              setEditPayment(payment);
                              setEditAmount(payment.amount);
                              setEditMonth(payment.month_year);
                              setEditTrxId(payment.transaction_id || '');
                              setEditMethod(payment.payment_method || 'bkash');
                              setIsEditDialogOpen(true);
                            }}
                            title={language === 'bn' ? 'সম্পাদনা করুন' : 'Edit'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>

                          {/* 4. Delete Record */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            onClick={() => {
                              setDeletePayment(payment);
                              setIsDeleteDialogOpen(true);
                            }}
                            title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 font-heading font-bold">
              <CheckCircle className="w-5 h-5" />
              <span>{language === 'bn' ? 'পেমেন্ট অনুমোদন নিশ্চিতকরণ' : 'Confirm Payment Approval'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {language === 'bn' 
                ? 'অনুমোদন করলে সদস্যের চাঁদা পরিশোধিত হিসেবে চিহ্নিত হবে এবং স্বয়ংক্রিয় SMS পৌঁছাবে।' 
                : 'Approving marks dues as paid and dispatches confirmation SMS.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-3.5 py-2">
              <div className="p-3.5 bg-muted/50 rounded-xl space-y-2 text-xs border border-border/60">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'সদস্য:' : 'Member:'}</span>
                  <div className="text-right">
                    <span className="font-bold text-foreground">{selectedPayment.members?.full_name}</span>
                    {selectedPayment.members?.phone && (
                      <p className="text-[11px] font-mono text-emerald-600">{selectedPayment.members.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'মাস:' : 'Month:'}</span>
                  <span className="font-semibold">{selectedPayment.month_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'পরিমাণ:' : 'Amount:'}</span>
                  <span className="font-extrabold text-base text-foreground">৳{selectedPayment.amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Method:'}</span>
                  <Badge variant="outline" className="font-bold text-xs uppercase">
                    {selectedPayment.payment_method || 'bKash'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'bn' ? 'ট্রানজেকশন আইডি:' : 'TrxID:'}</span>
                  <code className="bg-background px-2 py-0.5 rounded font-mono font-bold text-emerald-700">
                    {selectedPayment.transaction_id}
                  </code>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} className="rounded-xl h-9 text-xs">
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9 shadow-md"
              onClick={() => selectedPayment && approveMutation.mutate(selectedPayment)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {language === 'bn' ? 'অনুমোদন করুন' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 font-heading font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>{language === 'bn' ? 'পেমেন্ট প্রত্যাখ্যান' : 'Reject Payment'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {language === 'bn' 
                ? 'কারণ উল্লেখ করে পেমেন্ট প্রত্যাখ্যান করুন। সদস্যকে সংশোধনের নির্দেশনা পাঠানো হবে।' 
                : 'Provide a reason for rejecting this payment submission.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-3.5 py-2">
              <div className="p-3.5 bg-muted/50 rounded-xl space-y-1.5 text-xs border border-border/60">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'সদস্য:' : 'Member:'}</span>
                  <span className="font-bold">{selectedPayment.members?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'ট্রানজেকশন আইডি:' : 'TrxID:'}</span>
                  <code className="bg-background px-2 py-0.5 rounded font-mono font-bold text-red-600">{selectedPayment.transaction_id}</code>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rejection-reason" className="text-xs font-bold text-foreground">
                  {language === 'bn' ? 'প্রত্যাখ্যানের কারণ লিখুন: *' : 'Rejection Reason: *'}
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder={language === 'bn' 
                    ? 'যেমন: ট্রানজেকশন আইডি সঠিক নয়, অ্যাকাউন্টে টাকা পাওয়া যায়নি'
                    : 'e.g., Invalid transaction ID, funds not received'}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} className="rounded-xl h-9 text-xs">
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedPayment && rejectMutation.mutate({ 
                payment: selectedPayment, 
                reason: rejectionReason 
              })}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="font-bold text-xs rounded-xl h-9 shadow-md"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {language === 'bn' ? 'প্রত্যাখ্যান করুন' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voucher Print Dialog */}
      <Dialog open={isVoucherOpen} onOpenChange={setIsVoucherOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between font-heading font-bold text-lg">
              <span>{language === 'bn' ? 'অফিসিয়াল পেমেন্ট রশিদ' : 'Official Payment Voucher'}</span>
              <Button onClick={() => handlePrint()} size="sm" className="gap-2 rounded-xl bg-[#0B6B3A] text-white">
                <Printer className="w-4 h-4" />
                {language === 'bn' ? 'প্রিন্ট করুন' : 'Print'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {voucherTransaction && (
            <div className="mt-4 p-2 bg-slate-50 rounded-xl">
              <TransactionVoucher ref={voucherRef} transaction={voucherTransaction} language={language} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Approval Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 font-heading font-bold">
              <RotateCcw className="w-5 h-5" />
              <span>{language === 'bn' ? 'অনুমোদন বাতিল ও হিসাব সমন্বয়' : 'Revoke Payment Approval'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {language === 'bn' 
                ? 'অনুমোদন বাতিল করলে এর সাথে যুক্ত আর্থিক আয় স্বয়ংক্রিয়ভাবে বিয়োগ করা হবে এবং সদস্যের অ্যাকাউন্টে বকেয়া পুনরায় সক্রিয় হবে।' 
                : 'Revoking will deduct the amount from accounts and reactivate dues for member.'}
            </DialogDescription>
          </DialogHeader>
          {revokePayment && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-1.5">
                <p className="font-bold text-slate-800">
                  {revokePayment.members?.full_name} ({revokePayment.month_year})
                </p>
                <p className="text-slate-600">
                  পরিমাণ: <span className="font-bold text-amber-800">৳{revokePayment.amount}</span> | TrxID: {revokePayment.transaction_id || 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{language === 'bn' ? 'বাতিলের কারণ / নোট (ঐচ্ছিক):' : 'Reason / Note:'}</Label>
                <Input
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: ভুলবশত অনুমোদন করা হয়েছিল' : 'e.g. Approved accidentally'}
                  className="rounded-xl text-xs h-9"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)} className="rounded-xl h-9 text-xs">
              {language === 'bn' ? 'ফিরে যান' : 'Back'}
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-9 shadow-md"
              onClick={() => revokePayment && revokeApprovalMutation.mutate({ payment: revokePayment, reason: revokeReason })}
              disabled={revokeApprovalMutation.isPending}
            >
              {revokeApprovalMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              {language === 'bn' ? 'অনুমোদন বাতিল নিশ্চিত করুন' : 'Confirm Revoke'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 font-heading font-bold">
              <Edit className="w-5 h-5" />
              <span>{language === 'bn' ? 'পেমেন্ট তথ্য সম্পাদনা' : 'Edit Payment Details'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {language === 'bn' 
                ? 'এখানে পরিবর্তন করলে ডাটাবেজ এবং আর্থিক হিসাব উভয় স্থানেই আপডেট হবে।' 
                : 'Editing updates both dues record and finance accounts.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === 'bn' ? 'টাকার পরিমাণ (৳):' : 'Amount (৳):'}</Label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                className="rounded-xl text-xs h-9 font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === 'bn' ? 'মাস ও বছর (YYYY-MM):' : 'Month (YYYY-MM):'}</Label>
              <Input
                value={editMonth}
                onChange={(e) => setEditMonth(e.target.value)}
                placeholder="2026-11"
                className="rounded-xl text-xs h-9 font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID):' : 'TrxID:'}</Label>
              <Input
                value={editTrxId}
                onChange={(e) => setEditTrxId(e.target.value)}
                placeholder="JS817392HS"
                className="rounded-xl text-xs h-9 font-mono uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</Label>
              <Select value={editMethod} onValueChange={setEditMethod}>
                <SelectTrigger className="rounded-xl text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">বিকাশ (bKash)</SelectItem>
                  <SelectItem value="nagad">নগদ (Nagad)</SelectItem>
                  <SelectItem value="rocket">রকেট (Rocket)</SelectItem>
                  <SelectItem value="bank">ব্যাংক (Bank)</SelectItem>
                  <SelectItem value="cash">নগদ গ্রহণ (Cash)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl h-9 text-xs">
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 shadow-md"
              onClick={() => editPayment && editPaymentMutation.mutate({
                payment: editPayment,
                newAmount: editAmount,
                newMonth: editMonth,
                newTrxId: editTrxId,
                newMethod: editMethod,
              })}
              disabled={editPaymentMutation.isPending}
            >
              {editPaymentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 font-heading font-bold">
              <Trash2 className="w-5 h-5" />
              <span>{language === 'bn' ? 'পেমেন্ট রেকর্ড মুছে ফেলা' : 'Delete Payment Record'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {language === 'bn' 
                ? 'আপনি কি নিশ্চিত যে এই রেকর্ডটি মুছে ফেলতে চান? এর ফলে এর সাথে যুক্ত আর্থিক আয়ও সমন্বয় করা হবে।' 
                : 'Are you sure you want to delete this record? Associated finance balance will be adjusted.'}
            </DialogDescription>
          </DialogHeader>
          {deletePayment && (
            <div className="p-3 bg-red-50/70 border border-red-200/60 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-red-900">{deletePayment.members?.full_name} ({deletePayment.month_year})</p>
              <p className="text-red-700">পরিমাণ: ৳{deletePayment.amount} | TrxID: {deletePayment.transaction_id || 'N/A'}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl h-9 text-xs">
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              className="font-bold text-xs rounded-xl h-9 shadow-md"
              onClick={() => deletePayment && deletePaymentMutation.mutate(deletePayment)}
              disabled={deletePaymentMutation.isPending}
            >
              {deletePaymentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {language === 'bn' ? 'মুছে ফেলুন' : 'Delete Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentVerification;
