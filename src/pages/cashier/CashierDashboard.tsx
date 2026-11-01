import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Wallet, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  FileCheck, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useMultiTableRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const CashierDashboard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [cashierName, setCashierName] = useState('');

  // Real-time subscriptions for cashier dashboard
  const subscriptionTables = React.useMemo(() => [
    { table: 'transactions' as const, queryKeys: [['cashier-transactions-summary']] },
    { table: 'member_dues' as const, queryKeys: [['cashier-unpaid-dues']] },
    { table: 'members' as const, queryKeys: [['cashier-members-count']] },
  ], []);

  useMultiTableRealtimeSubscription(subscriptionTables);

  // Fetch cashier info
  useEffect(() => {
    const fetchCashierInfo = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('cashiers')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setCashierName(data.full_name);
      }
    };

    fetchCashierInfo();
  }, [user]);

  // Fetch transactions summary
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['cashier-transactions-summary'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0]);

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  // Fetch unpaid dues count
  const { data: unpaidDues, isLoading: duesLoading } = useQuery({
    queryKey: ['cashier-unpaid-dues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_dues')
        .select('id, amount')
        .eq('is_paid', false);

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  // Fetch members count
  const { data: membersCount, isLoading: membersLoading } = useQuery({
    queryKey: ['cashier-members-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 5000,
  });

  // Calculate totals
  const monthlyIncome = transactions?.filter(t => 
    ['member_fee', 'donation', 'event_fee', 'other_income'].includes(t.type)
  ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const monthlyExpense = transactions?.filter(t => 
    ['expense', 'other_expense'].includes(t.type)
  ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalUnpaidAmount = unpaidDues?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
  const netBalance = monthlyIncome - monthlyExpense;

  const isLoading = transactionsLoading || duesLoading || membersLoading;

  return (
    <div className="space-y-4 sm:space-y-5 pb-10 p-4 md:p-6">
      {/* 1. Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
          <Wallet className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{language === 'bn' ? 'ক্যাশিয়ার পোর্টাল' : 'Cashier Desk'}</span>
        </div>
        <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#14231B] font-heading tracking-tight leading-tight">
              {language === 'bn' ? `স্বাগতম, ${cashierName || 'ক্যাশিয়ার'}` : `Welcome, ${cashierName || 'Cashier'}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {language === 'bn' 
                ? 'আর্থিক লেনদেন, চাঁদা আদায় এবং রসিদ যাচাইয়ের সারসংক্ষেপ' 
                : 'Overview of income, expenses, and pending member dues'}
            </p>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {format(new Date(), 'dd MMMM yyyy', { locale: language === 'bn' ? bn : undefined })}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B6B3A]" />
        </div>
      ) : (
        <>
          {/* 2. Top 4 Activity Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: এই মাসের আয় */}
            <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
                <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#059669]">
                  <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
                </svg>
              </div>
              <div className="flex items-center gap-3.5 min-w-0 z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F4EA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <TrendingUp className="w-6 h-6 stroke-[2.2] text-[#059669]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500 truncate">
                    {language === 'bn' ? 'চলতি মাসের আয়' : 'Monthly Income'}
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                    ৳{monthlyIncome.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#059669] flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Card 2: এই মাসের ব্যয় */}
            <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
                <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#EF4444]">
                  <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
                </svg>
              </div>
              <div className="flex items-center gap-3.5 min-w-0 z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <TrendingDown className="w-6 h-6 stroke-[2.2] text-[#DC2626]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500 truncate">
                    {language === 'bn' ? 'চলতি মাসের ব্যয়' : 'Monthly Expense'}
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                    ৳{monthlyExpense.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Card 3: বকেয়া চাঁদা */}
            <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
                <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#F59E0B]">
                  <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
                </svg>
              </div>
              <div className="flex items-center gap-3.5 min-w-0 z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Receipt className="w-6 h-6 stroke-[2.2] text-[#D97706]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500 truncate">
                    {language === 'bn' ? 'বকেয়া চাঁদা' : 'Unpaid Dues'}
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                    ৳{totalUnpaidAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <span className="text-[10px] font-black">{unpaidDues?.length || 0}</span>
              </div>
            </div>

            {/* Card 4: নিট ক্যাশ ব্যালেন্স */}
            <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
                <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#3B82F6]">
                  <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
                </svg>
              </div>
              <div className="flex items-center gap-3.5 min-w-0 z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Wallet className="w-6 h-6 stroke-[2.2] text-[#2563EB]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500 truncate">
                    {language === 'bn' ? 'চলতি ব্যালেন্স' : 'Net Balance'}
                  </p>
                  <p className={`text-2xl sm:text-3xl font-black leading-tight mt-0.5 ${netBalance >= 0 ? 'text-[#059669]' : 'text-rose-600'}`}>
                    ৳{netBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* 3. Quick Action Navigation Cards (Dashboard style buttons) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Link
              to="/cashier/finance"
              className="group p-5 rounded-[22px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#0B6B3A]/30 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#E6F4EA] text-[#0B6B3A] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5 stroke-[2.3]" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B6B3A] group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'নতুন লেনদেন এন্ট্রি' : 'New Transaction'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'bn' ? 'আয় ও ব্যয়ের বিবরণ যোগ করুন' : 'Record income and expenses'}
                </p>
              </div>
            </Link>

            <Link
              to="/cashier/dues"
              className="group p-5 rounded-[22px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="w-5 h-5 stroke-[2.3]" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'মাসিক চাঁদা কালেকশন' : 'Member Dues Collection'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'bn' ? 'চাঁদা রসিদ ও বকেয়া হিসাব' : 'Collect member fees and receipts'}
                </p>
              </div>
            </Link>

            <Link
              to="/cashier/payment-verification"
              className="group p-5 rounded-[22px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-5 h-5 stroke-[2.3]" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'পেমেন্ট ভেরিফিকেশন' : 'Payment Verification'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'bn' ? 'অনলাইন চাঁদা পেমেন্ট অনুমোদন' : 'Verify pending member payments'}
                </p>
              </div>
            </Link>

            <Link
              to="/cashier/yearly-accounts"
              className="group p-5 rounded-[22px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5 stroke-[2.3]" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'বার্ষিক হিসাব-নিকাশ' : 'Yearly Accounts'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'bn' ? 'মাসভিত্তিক ব্যালেন্স ও রিপোর্ট' : 'Month-wise financial reports'}
                </p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default CashierDashboard;
