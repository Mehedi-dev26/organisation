import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Newspaper, 
  Calendar, 
  UserCog, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  UserPlus, 
  ArrowUpRight, 
  ArrowDownRight, 
  ClipboardList, 
  Trash2, 
  CreditCard, 
  HardDrive, 
  Database,
  Sprout,
  Building2,
  Box,
  ChevronRight,
  Cloud,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { useMultiTableRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface RecentActivity {
  id: string;
  type: 'member' | 'news' | 'event' | 'transaction';
  title: string;
  date: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const Dashboard = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();

  // Real-time subscriptions for all dashboard data
  useMultiTableRealtimeSubscription([
    { table: 'transactions', queryKeys: [['monthly-transactions'], ['transaction-types'], ['financial-summary']] },
    { table: 'members', queryKeys: [['admin-stats']] },
  ]);

  // Overall organization counts
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [members, news, events, committee] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }),
        supabase.from('news').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('committee_members').select('id', { count: 'exact', head: true }),
      ]);
      
      return {
        members: members.count || 0,
        news: news.count || 0,
        events: events.count || 0,
        committee: committee.count || 0,
      };
    },
  });

  // Monthly transaction data for charts (last 6-7 months)
  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-transactions'],
    queryFn: async () => {
      const months = [];
      const bnMonthNames = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুল'];
      
      for (let i = 6; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, type')
          .gte('transaction_date', format(start, 'yyyy-MM-dd'))
          .lte('transaction_date', format(end, 'yyyy-MM-dd'));
        
        const income = transactions?.filter(t => !['expense', 'other_expense'].includes(t.type))
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const expense = transactions?.filter(t => ['expense', 'other_expense'].includes(t.type))
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        
        const monthIndex = 6 - i;
        months.push({
          month: language === 'bn' 
            ? bnMonthNames[monthIndex % bnMonthNames.length] 
            : format(date, 'MMM'),
          income,
          expense,
        });
      }
      return months;
    },
  });

  // Financial summary
  const { data: financialSummary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('type, amount');
      
      if (!data) return { totalIncome: 0, totalExpense: 0, balance: 0 };
      
      const totalIncome = data
        .filter(t => !['expense', 'other_expense'].includes(t.type))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpense = data
        .filter(t => ['expense', 'other_expense'].includes(t.type))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      };
    },
  });

  // Storage usage query
  const { data: storageUsage } = useQuery({
    queryKey: ['storage-usage'],
    queryFn: async () => {
      const { data: memberPhotos } = await supabase.storage
        .from('member-photos')
        .list('', { limit: 1000 });
      
      const { data: pendingPhotos } = await supabase.storage
        .from('member-photos')
        .list('pending', { limit: 1000 });
      
      const { data: galleryImages } = await supabase.storage
        .from('gallery-images')
        .list('', { limit: 1000 });
      
      let memberPhotosSize = 0;
      let gallerySize = 0;
      let memberPhotosCount = 0;
      let galleryCount = 0;
      
      if (memberPhotos) {
        for (const file of memberPhotos) {
          if (file.metadata?.size) {
            memberPhotosSize += file.metadata.size;
            memberPhotosCount++;
          }
        }
      }
      
      if (pendingPhotos) {
        for (const file of pendingPhotos) {
          if (file.metadata?.size) {
            memberPhotosSize += file.metadata.size;
            memberPhotosCount++;
          }
        }
      }
      
      if (galleryImages) {
        for (const file of galleryImages) {
          if (file.metadata?.size) {
            gallerySize += file.metadata.size;
            galleryCount++;
          }
        }
      }
      
      const totalSize = memberPhotosSize + gallerySize;
      const totalFiles = memberPhotosCount + galleryCount;
      const maxStorage = 1 * 1024 * 1024 * 1024; // 1GB
      const usagePercent = (totalSize / maxStorage) * 100;
      
      return {
        totalSize,
        totalFiles,
        memberPhotosSize,
        memberPhotosCount,
        gallerySize,
        galleryCount,
        maxStorage,
        usagePercent,
      };
    },
    enabled: isAdmin,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Cashier activity logs
  const { data: activityLogs } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) return [];
      return data || [];
    },
    enabled: isAdmin,
  });

  // Recent Activities
  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const activities: RecentActivity[] = [];
      
      const { data: recentMembers } = await supabase
        .from('members')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (recentMembers) {
        recentMembers.forEach(member => {
          activities.push({
            id: `member-${member.id}`,
            type: 'member',
            title: language === 'bn' 
              ? `নতুন সদস্য: ${member.full_name}`
              : `New Member: ${member.full_name}`,
            date: member.created_at || '',
            icon: UserPlus,
            iconBg: 'bg-sky-100',
            iconColor: 'text-sky-600',
          });
        });
      }
      
      const { data: recentNews } = await supabase
        .from('news')
        .select('id, title_bn, title_en, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (recentNews) {
        recentNews.forEach(news => {
          activities.push({
            id: `news-${news.id}`,
            type: 'news',
            title: language === 'bn' 
              ? `নতুন সংবাদ: ${news.title_bn}`
              : `New News: ${news.title_en || news.title_bn}`,
            date: news.created_at || '',
            icon: Newspaper,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
          });
        });
      }
      
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);
    },
  });

  const formatActivityDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return format(date, 'dd MMMM yyyy, hh:mm a', { locale: language === 'bn' ? bn : undefined });
    } catch {
      return dateStr;
    }
  };

  // Pie chart data for transaction types
  const incomeVal = financialSummary?.totalIncome || 0;
  const expenseVal = financialSummary?.totalExpense || 0;
  const totalTransactions = incomeVal + expenseVal;

  const donutData = [
    { name: language === 'bn' ? 'আয়' : 'Income', value: incomeVal > 0 ? incomeVal : 1, color: '#059669' },
    { name: language === 'bn' ? 'ব্যয়' : 'Expense', value: expenseVal > 0 ? expenseVal : 0, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6 sm:space-y-7 pb-10">
      {/* 1. Header with compact "স্বাগতম!" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-[#0B6B3A]/10 text-[#0B6B3A] flex items-center justify-center">
              <Sprout className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              {language === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
            {language === 'bn' ? 'স্বাগতম!' : 'Welcome!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {language === 'bn' 
              ? 'সকল কার্যক্রম ও আর্থিক সারসংক্ষেপ' 
              : 'Overview of all organization activities and metrics'}
          </p>
        </div>
      </div>

      {/* 2. Top Row: 4 Main Activity Stat Buttons/Cards (Wider width, compact height) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* মোট সদস্য */}
        <Link 
          to="/admin/members" 
          className="group bg-white rounded-[18px] p-3.5 sm:p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-[14px] bg-[#E6F4EA] flex items-center justify-center text-[#0B6B3A] shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'মোট সদস্য' : 'Total Members'}
              </p>
              <p className="text-2xl font-black text-slate-900 leading-tight">
                {stats?.members || 1}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-[#0B6B3A] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </Link>

        {/* সংগঠন */}
        <Link 
          to="/admin/committee" 
          className="group bg-white rounded-[18px] p-3.5 sm:p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-[14px] bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'সংগঠন' : 'Organization'}
              </p>
              <p className="text-2xl font-black text-slate-900 leading-tight">
                3
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </Link>

        {/* ইভেন্ট */}
        <Link 
          to="/admin/events" 
          className="group bg-white rounded-[18px] p-3.5 sm:p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-[14px] bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'ইভেন্ট' : 'Events'}
              </p>
              <p className="text-2xl font-black text-slate-900 leading-tight">
                {stats?.events || 6}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </Link>

        {/* কমিটি সদস্য */}
        <Link 
          to="/admin/committee" 
          className="group bg-white rounded-[18px] p-3.5 sm:p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-[14px] bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
              <UserCog className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'কমিটি সদস্য' : 'Committee Members'}
              </p>
              <p className="text-2xl font-black text-slate-900 leading-tight">
                {stats?.committee || 0}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </Link>
      </div>

      {/* 3. Second Row: 4 Financial Cards (Borderless, Compact Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* মোট আয় */}
        <div className="bg-white rounded-[18px] p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                0%
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'মোট আয়' : 'Total Income'}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 my-1 leading-tight">
              ৳{financialSummary?.totalIncome?.toLocaleString() || 0}
            </p>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 font-medium border-t border-slate-50">
            {language === 'bn' ? 'গত মাসে: ৳০' : 'Last month: ৳0'}
          </div>
        </div>

        {/* মোট ব্যয় */}
        <div className="bg-white rounded-[18px] p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <ArrowDownRight className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" />
                0%
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'মোট ব্যয়' : 'Total Expense'}
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-600 my-1 leading-tight">
              ৳{financialSummary?.totalExpense?.toLocaleString() || 0}
            </p>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 font-medium border-t border-slate-50">
            {language === 'bn' ? 'গত মাসে: ৳০' : 'Last month: ৳0'}
          </div>
        </div>

        {/* ব্যালেন্স */}
        <div className="bg-white rounded-[18px] p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Database className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                0%
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'ব্যালেন্স' : 'Balance'}
            </p>
            <p className="text-xl sm:text-2xl font-black text-blue-600 my-1 leading-tight">
              ৳{financialSummary?.balance?.toLocaleString() || 0}
            </p>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 font-medium border-t border-slate-50">
            {language === 'bn' ? 'গত মাসে: ৳০' : 'Last month: ৳0'}
          </div>
        </div>

        {/* ক্যাশ ইন হ্যান্ড */}
        <div className="bg-white rounded-[18px] p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Box className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                0%
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'ক্যাশ ইন হ্যান্ড' : 'Cash in Hand'}
            </p>
            <p className="text-xl sm:text-2xl font-black text-purple-600 my-1 leading-tight">
              ৳{financialSummary?.balance?.toLocaleString() || 0}
            </p>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 font-medium border-t border-slate-50">
            {language === 'bn' ? 'গত মাসে: ৳০' : 'Last month: ৳0'}
          </div>
        </div>
      </div>

      {/* 4. Storage Usage Card ("স্টোরেজ ব্যবহার") */}
      {isAdmin && (
        <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Cloud className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-slate-800">
                {language === 'bn' ? 'স্টোরেজ ব্যবহার' : 'Storage Usage'}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-bold text-slate-700">
                {storageUsage ? formatBytes(storageUsage.totalSize) : '0 B'} / 1 GB
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">
              {language === 'bn' ? 'মোট ব্যবহৃত' : 'Total Used'}
            </p>
            <Progress 
              value={storageUsage?.usagePercent || 0} 
              className="h-3 bg-slate-100 rounded-full"
            />
            <p className="text-[11px] text-slate-500 font-bold text-right pt-0.5">
              {storageUsage?.usagePercent?.toFixed(2) || '0.00'}% {language === 'bn' ? 'ব্যবহৃত' : 'used'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* সদস্যদের ছবি */}
            <div className="bg-[#F0F7FF] rounded-2xl p-4 flex items-center gap-3.5 border border-blue-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {language === 'bn' ? 'সদস্যদের ছবি' : 'Member Photos'}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {storageUsage ? formatBytes(storageUsage.memberPhotosSize) : '0 B'} • {storageUsage?.memberPhotosCount || 0} {language === 'bn' ? 'টি ফাইল' : 'files'}
                </p>
              </div>
            </div>

            {/* গ্যালারী ছবি */}
            <div className="bg-[#FAF5FF] rounded-2xl p-4 flex items-center gap-3.5 border border-purple-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                <Database className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {language === 'bn' ? 'গ্যালারী ছবি' : 'Gallery Photos'}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {storageUsage ? formatBytes(storageUsage.gallerySize) : '0 B'} • {storageUsage?.galleryCount || 0} {language === 'bn' ? 'টি ফাইল' : 'files'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Middle Row: Monthly Income/Expense Area Chart & Transaction Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* মাসিক আয়-ব্যয় (Left) */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-600 stroke-[2.4]" />
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-800">
              {language === 'bn' ? 'মাসিক আয়-ব্যয়' : 'Monthly Income & Expense'}
            </h3>
          </div>
          <div className="h-[260px] sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} domain={[0, 4]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                  }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name={language === 'bn' ? 'আয়' : 'Income'}
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#incomeAreaGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name={language === 'bn' ? 'ব্যয়' : 'Expense'}
                  stroke="#ef4444" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#expenseAreaGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Legend */}
          <div className="flex items-center justify-center gap-6 mt-3 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-700">{language === 'bn' ? 'আয়' : 'Income'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-slate-700">{language === 'bn' ? 'ব্যয়' : 'Expense'}</span>
            </div>
          </div>
        </div>

        {/* লেনদেনের ধরন (Right) */}
        <div className="lg:col-span-5 bg-white rounded-[24px] p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600 stroke-[2.4]" />
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-800">
              {language === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Types'}
            </h3>
          </div>
          <div className="relative h-[220px] sm:h-[240px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`donut-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: number) => [`৳${val.toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Donut Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs font-semibold text-slate-500">
                {language === 'bn' ? 'মোট লেনদেন' : 'Total'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                ৳{totalTransactions.toLocaleString()}
              </span>
            </div>
          </div>
          {/* Custom Legend matching screenshot */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#059669]"></span>
              <span>{language === 'bn' ? 'আয়' : 'Income'} ৳{incomeVal} (0%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
              <span>{language === 'bn' ? 'ব্যয়' : 'Expense'} ৳{expenseVal} (0%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Cashier Activity Log Card ("ক্যাশিয়ার কার্যকলাপ লগ") */}
      {isAdmin && (
        <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ClipboardList className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-800">
                {language === 'bn' ? 'ক্যাশিয়ার কার্যকলাপ লগ' : 'Cashier Activity Logs'}
              </h3>
            </div>
            <Link
              to="/admin/cashiers"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs sm:text-sm font-bold hover:bg-[#0B6B3A] hover:text-white transition-all duration-200 shadow-2xs"
            >
              {language === 'bn' ? 'সকল লগ দেখুন' : 'View All Logs'}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {activityLogs && activityLogs.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
                  <div className={`p-2 rounded-lg ${
                    log.action_type === 'delete' 
                      ? 'bg-red-100 text-red-600' 
                      : log.action_type === 'payment' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                  }`}>
                    {log.action_type === 'delete' ? (
                      <Trash2 className="w-4 h-4" />
                    ) : log.action_type === 'payment' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {language === 'bn' ? log.description_bn : log.description_en}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        log.user_role?.includes('cashier') 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {log.user_role?.includes('cashier') 
                          ? (language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier')
                          : (language === 'bn' ? 'অ্যাডমিন' : 'Admin')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {log.user_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {formatActivityDate(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State Matching Screenshot with Notepad & Leaf Sparkles */
            <div className="py-10 sm:py-12 flex flex-col items-center justify-center text-center">
              <div className="relative inline-flex items-center justify-center gap-4">
                {/* Left Leaf Sparkle */}
                <div className="w-7 h-7 text-emerald-500/70 flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M19 16C14 15 9.5 12 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M17 21C12.5 20.5 8 18 3 13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Center Green Clipboard Checklist Icon */}
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
                  <FileSpreadsheet className="w-8 h-8 stroke-[2.2]" />
                </div>

                {/* Right Leaf Sparkle */}
                <div className="w-7 h-7 text-emerald-500/70 flex-shrink-0 -scale-x-100">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M19 16C14 15 9.5 12 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M17 21C12.5 20.5 8 18 3 13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <p className="font-heading font-bold text-sm sm:text-base text-slate-700 mt-4">
                {language === 'bn' ? 'কোনো কার্যকলাপ লগ নেই' : 'No activity logs found'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 7. Bottom Row: Recent Activity & Monthly Comparison (সাম্প্রতিক কার্যক্রম & মাসিক তুলনা) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* সাম্প্রতিক কার্যক্রম (Left) */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 stroke-[2.4]" />
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-800">
                {language === 'bn' ? 'সাম্প্রতিক কার্যক্রম' : 'Recent Activity'}
              </h3>
            </div>
            <Link
              to="/admin/news"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E6F4EA] text-[#0B6B3A] text-xs font-bold hover:bg-[#0B6B3A] hover:text-white transition-colors"
            >
              {language === 'bn' ? 'সকল দেখুন' : 'View All'}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${activity.iconBg} ${activity.iconColor} flex items-center justify-center flex-shrink-0`}>
                      <activity.icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                        {activity.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatActivityDate(activity.date)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              {language === 'bn' ? 'কোন সাম্প্রতিক কার্যক্রম নেই' : 'No recent activities'}
            </div>
          )}
        </div>

        {/* মাসিক তুলনা (Right) */}
        <div className="lg:col-span-5 bg-white rounded-[24px] p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600 stroke-[2.4]" />
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-800">
              {language === 'bn' ? 'মাসিক তুলনা' : 'Monthly Comparison'}
            </h3>
          </div>
          <div className="h-[230px] sm:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} domain={[0, 4]} />
                <Tooltip 
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px'
                  }}
                />
                <Bar 
                  dataKey="income" 
                  name={language === 'bn' ? 'আয়' : 'Income'}
                  fill="#059669" 
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
                <Bar 
                  dataKey="expense" 
                  name={language === 'bn' ? 'ব্যয়' : 'Expense'}
                  fill="#EF4444" 
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#059669]"></span>
              <span className="text-slate-700">{language === 'bn' ? 'আয়' : 'Income'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
              <span className="text-slate-700">{language === 'bn' ? 'ব্যয়' : 'Expense'}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
