import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Newspaper, Calendar, UserCog, TrendingUp, Activity, DollarSign, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

interface RecentActivity {
  id: string;
  type: 'member' | 'news' | 'event' | 'transaction';
  title: string;
  date: string;
  icon: React.ElementType;
  color: string;
}

const Dashboard = () => {
  const { language } = useLanguage();
  const { user, isAdmin } = useAuth();

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

  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const activities: RecentActivity[] = [];
      
      // Fetch recent members
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
      
      // Fetch recent news
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
      
      // Fetch recent transactions
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('id, type, amount, created_at, description_bn, description_en')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (recentTransactions) {
        recentTransactions.forEach(tx => {
          const typeLabels: Record<string, { bn: string; en: string }> = {
            member_fee: { bn: 'সদস্য চাঁদা', en: 'Member Fee' },
            donation: { bn: 'অনুদান', en: 'Donation' },
            event_fee: { bn: 'ইভেন্ট ফি', en: 'Event Fee' },
            expense: { bn: 'ব্যয়', en: 'Expense' },
            other_income: { bn: 'অন্যান্য আয়', en: 'Other Income' },
            other_expense: { bn: 'অন্যান্য ব্যয়', en: 'Other Expense' },
          };
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
      
      // Sort by date and take top 5
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'দ্রুত পরিসংখ্যান' : 'Quick Stats'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {language === 'bn' ? 'অনুমোদিত সদস্য' : 'Approved Members'}
                </span>
                <span className="font-semibold">{stats?.members || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {language === 'bn' ? 'প্রকাশিত সংবাদ' : 'Published News'}
                </span>
                <span className="font-semibold">{stats?.news || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {language === 'bn' ? 'আসন্ন ইভেন্ট' : 'Upcoming Events'}
                </span>
                <span className="font-semibold">{stats?.events || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
