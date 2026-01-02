import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Newspaper, Calendar, UserCog, TrendingUp, Activity, DollarSign, UserPlus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { bn } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

interface RecentActivity {
  id: string;
  type: 'member' | 'news' | 'event' | 'transaction';
  title: string;
  date: string;
  icon: React.ElementType;
  color: string;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();

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

  // Monthly transaction data for chart
  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-transactions'],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
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
        
        months.push({
          month: format(date, 'MMM', { locale: language === 'bn' ? bn : undefined }),
          income,
          expense,
        });
      }
      return months;
    },
  });

  // Transaction type distribution
  const { data: transactionTypes } = useQuery({
    queryKey: ['transaction-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('type, amount');
      
      if (!data) return [];
      
      const typeMap: Record<string, number> = {};
      data.forEach(t => {
        typeMap[t.type] = (typeMap[t.type] || 0) + Number(t.amount);
      });
      
      const typeLabels: Record<string, { bn: string; en: string }> = {
        member_fee: { bn: 'সদস্য চাঁদা', en: 'Member Fee' },
        donation: { bn: 'অনুদান', en: 'Donation' },
        event_fee: { bn: 'ইভেন্ট ফি', en: 'Event Fee' },
        expense: { bn: 'ব্যয়', en: 'Expense' },
        other_income: { bn: 'অন্যান্য আয়', en: 'Other Income' },
        other_expense: { bn: 'অন্যান্য ব্যয়', en: 'Other Expense' },
      };
      
      return Object.entries(typeMap).map(([type, amount]) => ({
        name: language === 'bn' ? typeLabels[type]?.bn || type : typeLabels[type]?.en || type,
        value: amount,
      }));
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

  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const activities: RecentActivity[] = [];
      
      const { data: recentMembers } = await supabase
        .from('members')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (recentMembers) {
        recentMembers.forEach(member => {
          activities.push({
            id: `member-${member.id}`,
            type: 'member',
            title: language === 'bn' 
              ? `নতুন সদস্য: ${member.full_name}`
              : `New member: ${member.full_name}`,
            date: member.created_at || '',
            icon: UserPlus,
            color: 'text-blue-600',
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
              : `New news: ${news.title_en || news.title_bn}`,
            date: news.created_at || '',
            icon: Newspaper,
            color: 'text-green-600',
          });
        });
      }
      
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('id, type, amount, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (recentTransactions) {
        const typeLabels: Record<string, { bn: string; en: string }> = {
          member_fee: { bn: 'সদস্য চাঁদা', en: 'Member Fee' },
          donation: { bn: 'অনুদান', en: 'Donation' },
          event_fee: { bn: 'ইভেন্ট ফি', en: 'Event Fee' },
          expense: { bn: 'ব্যয়', en: 'Expense' },
          other_income: { bn: 'অন্যান্য আয়', en: 'Other Income' },
          other_expense: { bn: 'অন্যান্য ব্যয়', en: 'Other Expense' },
        };
        recentTransactions.forEach(tx => {
          const label = typeLabels[tx.type] || { bn: tx.type, en: tx.type };
          activities.push({
            id: `tx-${tx.id}`,
            type: 'transaction',
            title: language === 'bn' 
              ? `${label.bn}: ৳${tx.amount}`
              : `${label.en}: ৳${tx.amount}`,
            date: tx.created_at || '',
            icon: DollarSign,
            color: 'text-purple-600',
          });
        });
      }
      
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
    },
  });

  const formatActivityDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return format(date, 'dd MMM yyyy, hh:mm a', { locale: language === 'bn' ? bn : undefined });
    } catch {
      return dateStr;
    }
  };

  const statCards = [
    {
      title: language === 'bn' ? 'মোট সদস্য' : 'Total Members',
      value: stats?.members || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: language === 'bn' ? 'সংবাদ' : 'News Articles',
      value: stats?.news || 0,
      icon: Newspaper,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: language === 'bn' ? 'ইভেন্ট' : 'Events',
      value: stats?.events || 0,
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: language === 'bn' ? 'কমিটি সদস্য' : 'Committee Members',
      value: stats?.committee || 0,
      icon: UserCog,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">
          {language === 'bn' ? 'স্বাগতম!' : 'Welcome!'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'bn' 
            ? 'সংগঠন ব্যবস্থাপনা ড্যাশবোর্ডে আপনাকে স্বাগতম' 
            : 'Welcome to the organization management dashboard'}
        </p>
      </div>

      {!isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-800">
              {language === 'bn' 
                ? '⚠️ আপনার অ্যাডমিন অ্যাক্সেস নেই। শুধুমাত্র দেখতে পারবেন।' 
                : '⚠️ You do not have admin access. View only mode.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট আয়' : 'Total Income'}
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  ৳{financialSummary?.totalIncome?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <ArrowUpRight className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট ব্যয়' : 'Total Expense'}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  ৳{financialSummary?.totalExpense?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ArrowDownRight className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট ব্যালেন্স' : 'Total Balance'}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  ৳{financialSummary?.balance?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart - Monthly Income/Expense */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'মাসিক আয়-ব্যয়' : 'Monthly Income/Expense'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData || []}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    name={language === 'bn' ? 'আয়' : 'Income'}
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#incomeGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    name={language === 'bn' ? 'ব্যয়' : 'Expense'}
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#expenseGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Transaction Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Types'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {transactionTypes && transactionTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transactionTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {transactionTypes.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {language === 'bn' ? 'কোন ডাটা নেই' : 'No data available'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'সাম্প্রতিক কার্যক্রম' : 'Recent Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className={`p-2 rounded-lg bg-muted ${activity.color}`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatActivityDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                {language === 'bn' 
                  ? 'কোন সাম্প্রতিক কার্যক্রম নেই' 
                  : 'No recent activity'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Monthly Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'মাসিক তুলনা' : 'Monthly Comparison'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="income" 
                    name={language === 'bn' ? 'আয়' : 'Income'}
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="expense" 
                    name={language === 'bn' ? 'ব্যয়' : 'Expense'}
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
