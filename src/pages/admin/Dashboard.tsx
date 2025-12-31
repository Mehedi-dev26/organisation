import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Newspaper, Calendar, UserCog, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
            <div className="text-muted-foreground text-center py-8">
              {language === 'bn' 
                ? 'কোন সাম্প্রতিক কার্যক্রম নেই' 
                : 'No recent activity'}
            </div>
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
