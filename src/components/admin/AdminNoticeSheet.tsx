import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { 
  Bell, 
  Users, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  ShieldAlert,
  Activity,
  UserPlus,
  CreditCard
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

interface AdminNoticeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminNoticeSheet: React.FC<AdminNoticeSheetProps> = ({ open, onOpenChange }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'activities'>('pending');

  // 1. Fetch pending member applications
  const { data: pendingMembers = [] } = useQuery({
    queryKey: ['notice-pending-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, phone, created_at, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return [];
      return data || [];
    },
    refetchInterval: 15000, // Auto-poll every 15s for live updates
  });

  // 2. Fetch pending dues payment verification requests
  const { data: pendingPayments = [] } = useQuery({
    queryKey: ['notice-pending-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_dues')
        .select(`
          id, 
          amount, 
          month_year, 
          transaction_id, 
          payment_method, 
          submitted_at, 
          members (full_name, phone)
        `)
        .eq('payment_status', 'submitted')
        .eq('is_paid', false)
        .order('submitted_at', { ascending: false })
        .limit(10);
      if (error) return [];
      return data || [];
    },
    refetchInterval: 15000,
  });

  // 3. Fetch recent activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['notice-activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) return [];
      return data || [];
    },
    refetchInterval: 20000,
  });

  const totalPending = pendingMembers.length + pendingPayments.length;

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: language === 'bn' ? bn : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 flex flex-col bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 z-50 shadow-2xl"
      >
        {/* Header with vibrant Emerald styling */}
        <SheetHeader className="p-5 bg-gradient-to-r from-[#09351D] via-[#0B6B3A] to-teal-800 text-white border-b border-emerald-700/50 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-md">
              <Bell className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <SheetTitle className="text-white text-base sm:text-lg font-heading font-extrabold flex items-center gap-2">
                <span>{language === 'bn' ? 'রিয়েলটাইম নোটিশ ও অ্যাক্টিভিটি' : 'Live Notices & Activity Stream'}</span>
              </SheetTitle>
              <SheetDescription className="text-emerald-100/90 text-xs mt-0.5">
                {language === 'bn'
                  ? 'সংগঠনের সাম্প্রতিক নোটিফিকেশন ও অপেক্ষমান রিকোয়েস্ট'
                  : 'Real-time notifications and pending management actions'}
              </SheetDescription>
            </div>
          </div>

          {/* Quick tab switch buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-[#0B6B3A] shadow-md shadow-emerald-950/20'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অপেক্ষমান আবেদন' : 'Pending Requests'}</span>
              {totalPending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-extrabold ml-0.5">
                  {totalPending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-white text-[#0B6B3A] shadow-md shadow-emerald-950/20'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'কার্যক্রম হিস্টোরি' : 'Activity Logs'}</span>
            </button>
          </div>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
          {activeTab === 'pending' ? (
            <div className="space-y-4">
              {/* Member Registrations Pending */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'bn' ? 'নতুন সদস্য আবেদন' : 'Membership Applications'}</span>
                  </h4>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60">
                    {pendingMembers.length}
                  </span>
                </div>

                {pendingMembers.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
                    {language === 'bn' ? 'কোনো নতুন সদস্য আবেদন অপেক্ষমান নেই' : 'No pending membership applications'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingMembers.map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/40 shadow-xs hover:border-blue-400 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {m.full_name}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span>{m.phone}</span>
                            <span>•</span>
                            <span className="text-slate-400">{formatTime(m.created_at)}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavigate('/admin/members')}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{language === 'bn' ? 'যাচাই' : 'Review'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dues Payments Pending */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'bn' ? 'চাঁদা পেমেন্ট যাচাই' : 'Dues Payment Verification'}</span>
                  </h4>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60">
                    {pendingPayments.length}
                  </span>
                </div>

                {pendingPayments.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
                    {language === 'bn' ? 'কোনো অপেক্ষমান পেমেন্ট রিকোয়েস্ট নেই' : 'No pending payment requests'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingPayments.map((p: any) => {
                      const memberName = p.members?.full_name || 'Member';
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-900/40 shadow-xs hover:border-amber-400 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {memberName}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold">
                                ৳{p.amount}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                              <span className="capitalize">{p.payment_method || 'bkash'}</span>
                              <span>•</span>
                              <span>TxID: {p.transaction_id || 'N/A'}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {p.submitted_at ? formatTime(p.submitted_at) : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleNavigate('/admin/payment-verification')}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>{language === 'bn' ? 'যাচাই' : 'Verify'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All Caught Up Message */}
              {totalPending === 0 && (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-center space-y-2 mt-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    {language === 'bn' ? 'সবকিছু সম্পূর্ণ ও আপ-টু-ডেট!' : 'All Caught Up!'}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {language === 'bn'
                      ? 'বর্তমানে কোনো পেন্ডিং আবেদন নেই। নতুন আবেদন আসলে সাথে সাথে এখানে দেখাবে।'
                      : 'No actions currently required. New requests will appear here in real-time.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: Activity Logs */
            <div className="space-y-2.5">
              {activityLogs.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  {language === 'bn' ? 'কোনো সাম্প্রতিক অ্যাক্টিভিটি পাওয়া যায়নি' : 'No recent activity recorded'}
                </div>
              ) : (
                activityLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50 mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                          {log.action_type?.replace(/_/g, ' ') || 'Activity'}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTime(log.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {log.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer quick link */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            {language === 'bn' ? 'সময়ের বাতিঘর অ্যাডমিন হাব' : 'Samoyer Batighor Admin'}
          </p>
          <button
            type="button"
            onClick={() => handleNavigate('/admin')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdminNoticeSheet;
