import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
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
  ArrowRight,
  ExternalLink,
  Clock,
  DollarSign,
  ShieldAlert,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { useMultiTableRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const CashierDashboard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [cashierName, setCashierName] = useState('');

  // Real-time subscriptions for cashier dashboard data
  const subscriptionTables = React.useMemo(() => [
    { table: 'transactions' as const, queryKeys: [['cashier-transactions-summary'], ['cashier-monthly-chart'], ['cashier-recent-transactions']] },
    { table: 'member_dues' as const, queryKeys: [['cashier-unpaid-dues']] },
    { table: 'payment_verifications' as const, queryKeys: [['cashier-pending-verifications']] },
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

  // 1. Fetch current month transactions summary
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['cashier-transactions-summary'],
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', start.toISOString().split('T')[0]);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  // 2. Fetch unpaid dues
  const { data: unpaidDues, isLoading: duesLoading } = useQuery({
    queryKey: ['cashier-unpaid-dues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_dues')
        .select('id, amount, member_id, month, year')
        .eq('is_paid', false);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  // 3. Fetch pending payment verifications
  const { data: pendingVerifications = [], isLoading: verificationsLoading } = useQuery({
    queryKey: ['cashier-pending-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_verifications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) return [];
      return data || [];
    },
    refetchInterval: 5000,
  });

  // 4. Fetch recent transactions for live ledger
  const { data: recentTransactions = [], isLoading: recentLoading } = useQuery({
    queryKey: ['cashier-recent-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) return [];
      return data || [];
    },
    refetchInterval: 5000,
  });

  // 5. Monthly trend data for the interactive AreaChart (last 6 months)
  const { data: monthlyData = [] } = useQuery({
    queryKey: ['cashier-monthly-chart'],
    queryFn: async () => {
      const months = [];
      const bnMonthNames = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
      
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const { data: mTransactions } = await supabase
          .from('transactions')
          .select('amount, type')
          .gte('transaction_date', format(start, 'yyyy-MM-dd'))
          .lte('transaction_date', format(end, 'yyyy-MM-dd'));

        const income = mTransactions?.filter(t => 
          ['member_fee', 'donation', 'event_fee', 'other_income'].includes(t.type)
        ).reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

        const expense = mTransactions?.filter(t => 
          ['expense', 'other_expense'].includes(t.type)
        ).reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

        const monthIdx = date.getMonth();
        months.push({
          month: language === 'bn' ? bnMonthNames[monthIdx] : format(date, 'MMM'),
          income,
          expense,
          net: income - expense,
        });
      }
      return months;
    },
    refetchInterval: 15000,
  });

  // Financial category breakdown for BarChart
  const categoryData = React.useMemo(() => {
    if (!transactions) return [];
    const breakdown: Record<string, number> = {
      member_fee: 0,
      donation: 0,
      event_fee: 0,
      expense: 0,
    };

    transactions.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'member_fee') breakdown.member_fee += amt;
      else if (t.type === 'donation') breakdown.donation += amt;
      else if (t.type === 'event_fee') breakdown.event_fee += amt;
      else if (['expense', 'other_expense'].includes(t.type)) breakdown.expense += amt;
    });

    return [
      { name: language === 'bn' ? 'সদস্য চাঁদা' : 'Member Fee', amount: breakdown.member_fee, fill: '#059669' },
      { name: language === 'bn' ? 'সাধারণ অনুদান' : 'Donations', amount: breakdown.donation, fill: '#10B981' },
      { name: language === 'bn' ? 'ইভেন্ট ফান্ড' : 'Event Fee', amount: breakdown.event_fee, fill: '#3B82F6' },
      { name: language === 'bn' ? 'মোট ব্যয়' : 'Expenses', amount: breakdown.expense, fill: '#EF4444' },
    ];
  }, [transactions, language]);

  // Compute totals
  const monthlyIncome = transactions?.filter(t => 
    ['member_fee', 'donation', 'event_fee', 'other_income'].includes(t.type)
  ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const monthlyExpense = transactions?.filter(t => 
    ['expense', 'other_expense'].includes(t.type)
  ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalUnpaidAmount = unpaidDues?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
  const netBalance = monthlyIncome - monthlyExpense;

  const isLoading = transactionsLoading || duesLoading || verificationsLoading;

  return (
    <div className="space-y-6">
      {/* 1. Signature Two-tone Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
            <Wallet className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'bn' ? 'ক্যাশিয়ার ড্যাশবোর্ড ও আর্থিক সারসংক্ষেপ' : 'Cashier Desk & Financial Overview'}</span>
          </div>
          <div className="mt-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#14231B] font-heading tracking-tight leading-tight">
              {language === 'bn' ? `স্বাগতম, ${cashierName || 'ক্যাশিয়ার'}` : `Welcome, ${cashierName || 'Cashier'}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {language === 'bn' 
                ? 'আর্থিক লেনদেন, চাঁদা আদায় এবং রসিদ যাচাইয়ের কেন্দ্রীয় নিয়ন্ত্রণ ব্যবস্থা' 
                : 'Centralized overview of income, expenditures, and member dues'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-2xs">
            <Calendar className="w-4 h-4 text-[#0B6B3A]" />
            <span>{format(new Date(), 'dd MMMM yyyy', { locale: language === 'bn' ? bn : enUS })}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="h-10 w-10 animate-spin text-[#0B6B3A]" />
        </div>
      ) : (
        <>
          {/* 2. Top 4 Live Stat Cards matching Admin aesthetic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: এই মাসের আয় */}
            <div className="group bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
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
            <div className="group bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
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
            <div className="group bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
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
                <span className="text-[11px] font-black">{unpaidDues?.length || 0}</span>
              </div>
            </div>

            {/* Card 4: নিট ক্যাশ ব্যালেন্স */}
            <div className="group bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
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

          {/* 3. Middle Section: Area Graph on Left + 4 Quick Actions (2x2 grid) on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Interactive Monthly Area Chart (7 Columns) */}
            <div className="lg:col-span-7 bg-white rounded-[24px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600 stroke-[2.4]" />
                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-800">
                      {language === 'bn' ? 'মাসিক আয়-ব্যয় তুলনামূলক চিত্র' : 'Monthly Income vs Expense Trend'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-600">{language === 'bn' ? 'আয়' : 'Income'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-slate-600">{language === 'bn' ? 'ব্যয়' : 'Expense'}</span>
                    </div>
                  </div>
                </div>

                <div className="h-[260px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cashierIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="cashierExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #E2E8F0',
                          borderRadius: '14px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                        }}
                        formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        name={language === 'bn' ? 'আয়' : 'Income'}
                        stroke="#059669" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#cashierIncomeGrad)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expense" 
                        name={language === 'bn' ? 'ব্যয়' : 'Expense'}
                        stroke="#ef4444" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#cashierExpenseGrad)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quick Actions (5 Columns) - 4 compact cards in a 2x2 grid */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-heading font-extrabold text-base text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{language === 'bn' ? 'ক্যাশিয়ার কুইক অ্যাকশন' : 'Quick Actions'}</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold">{language === 'bn' ? '১-ক্লিকে অ্যাক্সেস' : '1-Click Access'}</span>
              </div>

              {/* 2x2 Compact Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                {/* 1. নতুন লেনদেন এন্ট্রি */}
                <Link
                  to="/cashier/finance"
                  className="group p-4 rounded-[22px] bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-[#0B6B3A]/40 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] text-[#0B6B3A] flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <Wallet className="w-5 h-5 stroke-[2.3]" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B6B3A] group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#0B6B3A] transition-colors leading-tight">
                      {language === 'bn' ? 'লেনদেন এন্ট্রি' : 'New Transaction'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {language === 'bn' ? 'আয় ও ব্যয়ের হিসাব' : 'Record transactions'}
                    </p>
                  </div>
                </Link>

                {/* 2. মাসিক চাঁদা আদায় */}
                <Link
                  to="/cashier/dues"
                  className="group p-4 rounded-[22px] bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-amber-400/40 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <Receipt className="w-5 h-5 stroke-[2.3]" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#D97706] transition-colors leading-tight">
                      {language === 'bn' ? 'চাঁদা কালেকশন' : 'Dues Collection'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {language === 'bn' ? 'রসিদ প্রদান ও আদায়' : 'Issue dues receipts'}
                    </p>
                  </div>
                </Link>

                {/* 3. পেমেন্ট যাচাই */}
                <Link
                  to="/cashier/payment-verification"
                  className="group p-4 rounded-[22px] bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-blue-400/40 transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <FileCheck className="w-5 h-5 stroke-[2.3]" />
                    </div>
                    {pendingVerifications.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                        {pendingVerifications.length}
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#2563EB] transition-colors leading-tight">
                      {language === 'bn' ? 'পেমেন্ট যাচাই' : 'Payment Verify'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {language === 'bn' ? 'অনলাইন রসিদ অনুমোদন' : 'Approve payments'}
                    </p>
                  </div>
                </Link>

                {/* 4. বার্ষিক হিসাব */}
                <Link
                  to="/cashier/yearly-accounts"
                  className="group p-4 rounded-[22px] bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-purple-400/40 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <Calendar className="w-5 h-5 stroke-[2.3]" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#7C3AED] transition-colors leading-tight">
                      {language === 'bn' ? 'বার্ষিক হিসাব' : 'Yearly Audit'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {language === 'bn' ? 'মাসিক অডিট ও ব্যালেন্স' : 'Yearly report & audit'}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* 4. Lower Graphs Section: Category Breakdown Bar Chart */}
          <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 stroke-[2.4]" />
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-800">
                  {language === 'bn' ? 'চলতি মাসের খাতভিত্তিক আর্থিক হিসাব' : 'Category-wise Financial Breakdown'}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {language === 'bn' ? 'রিয়েলটাইম লেনদেন তথ্য' : 'Real-time Ledger Data'}
              </span>
            </div>

            <div className="h-[220px] sm:h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} />
                  <Tooltip 
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Bottom Two Tables: Recent Transactions + Pending Online Payments Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Transactions Live Ledger (7 Columns) */}
            <div className="lg:col-span-7 bg-white rounded-[24px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0B6B3A] stroke-[2.4]" />
                  <h3 className="font-heading font-extrabold text-base text-slate-800">
                    {language === 'bn' ? 'সাম্প্রতিক আর্থিক লেনদেন' : 'Recent Transactions'}
                  </h3>
                </div>
                <Link 
                  to="/cashier/finance" 
                  className="text-xs font-bold text-[#0B6B3A] hover:underline flex items-center gap-1"
                >
                  <span>{language === 'bn' ? 'সব দেখুন' : 'View All'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentTransactions.map((tx: any) => {
                    const isIncome = ['member_fee', 'donation', 'event_fee', 'other_income'].includes(tx.type);
                    return (
                      <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {tx.description || (isIncome ? 'আয় ভাউচার' : 'ব্যয় ভাউচার')}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {tx.transaction_date} • {tx.payment_method || 'Cash'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-black ${isIncome ? 'text-[#059669]' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'}৳{Number(tx.amount || 0).toLocaleString()}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {tx.type === 'member_fee' ? 'চাঁদা' : tx.type === 'donation' ? 'অনুদান' : 'খরচ'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  {language === 'bn' ? 'কোনো সাম্প্রতিক লেনদেন পাওয়া যায়নি' : 'No recent transactions found'}
                </div>
              )}
            </div>

            {/* Pending Online Payments Queue (5 Columns) */}
            <div className="lg:col-span-5 bg-white rounded-[24px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600 stroke-[2.4]" />
                  <h3 className="font-heading font-extrabold text-base text-slate-800">
                    {language === 'bn' ? 'অনলাইন পেমেন্ট কিউ' : 'Verification Queue'}
                  </h3>
                </div>
                <Link 
                  to="/cashier/payment-verification" 
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>{language === 'bn' ? 'যাচাই করুন' : 'Verify'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {pendingVerifications.length > 0 ? (
                <div className="space-y-2.5">
                  {pendingVerifications.map((pv: any) => (
                    <div key={pv.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {pv.member_name || pv.phone || 'অনলাইন আবেদনকারী'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          TrxID: {pv.transaction_id || 'N/A'} • {pv.payment_method || 'bKash'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-blue-700">
                          ৳{Number(pv.amount || 0).toLocaleString()}
                        </p>
                        <Link
                          to="/cashier/payment-verification"
                          className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >
                          {language === 'bn' ? 'যাচাই' : 'Verify'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p>{language === 'bn' ? 'সব পেমেন্ট যাচাই সম্পন্ন আছে' : 'All payments are verified'}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CashierDashboard;
