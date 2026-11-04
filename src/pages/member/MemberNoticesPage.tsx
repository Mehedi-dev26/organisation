import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMember } from '@/components/member/MemberContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Megaphone,
  Search,
  Calendar,
  AlertTriangle,
  CreditCard,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  BellRing,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import {
  isPushSupported,
  getNotificationPermission,
  requestPushPermission,
  PushPermissionStatus
} from '@/services/pushNotificationService';

export interface NoticeRecord {
  id: string;
  title_bn: string;
  title_en: string;
  content_bn: string;
  category: 'urgent' | 'general' | 'meeting' | 'dues' | 'event';
  target_audience: 'all' | 'executive' | 'general_members';
  send_sms: boolean;
  send_push: boolean;
  is_active: boolean;
  created_at: string;
}

const SETTINGS_KEY_NOTICES = 'organization_notices';

export const MemberNoticesPage: React.FC = () => {
  const { language } = useLanguage();
  const { memberData, unpaidMonths, unpaidDues } = useMember();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>(getNotificationPermission());
  const [isRequestingPush, setIsRequestingPush] = useState(false);

  // Fetch Notices from site_settings
  const { data: notices = [], isLoading, refetch, isFetching } = useQuery<NoticeRecord[]>({
    queryKey: [SETTINGS_KEY_NOTICES],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', SETTINGS_KEY_NOTICES)
          .maybeSingle();

        if (error || !data?.value) {
          const cached = localStorage.getItem('batighor_notices');
          return cached ? JSON.parse(cached) : [];
        }

        const list = Array.isArray(data.value) ? (data.value as NoticeRecord[]) : [];
        localStorage.setItem('batighor_notices', JSON.stringify(list));
        return list;
      } catch (err) {
        console.warn('Failed to fetch notices:', err);
        const cached = localStorage.getItem('batighor_notices');
        return cached ? JSON.parse(cached) : [];
      }
    },
  });

  // Handle Push Permission activation
  const handleEnablePush = async () => {
    setIsRequestingPush(true);
    try {
      const granted = await requestPushPermission();
      setPushStatus(getNotificationPermission());
      if (granted) {
        toast({
          title: language === 'bn' ? 'নোটিফিকেশন সক্রিয়!' : 'Notifications Enabled!',
          description: language === 'bn' 
            ? 'এখন থেকে যেকোনো জরুরি নোটিশ ও বকেয়া রিমাইন্ডার সরাসরি আপনার ফোনে নোটিফিকেশন হিসেবে পাবেন।' 
            : 'You will receive instant alerts on this device.',
        });
      } else {
        toast({
          title: language === 'bn' ? 'অনুমতি প্রয়োজন' : 'Permission Required',
          description: language === 'bn' 
            ? 'ব্রাউজার সেটিংস থেকে নোটিফিকেশন অনুমোদন করুন।' 
            : 'Please allow notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsRequestingPush(false);
    }
  };

  // Filter Active Notices for members
  const activeNotices = useMemo(() => {
    return notices.filter((n) => n.is_active !== false);
  }, [notices]);

  const filteredNotices = useMemo(() => {
    return activeNotices.filter((n) => {
      if (activeCategory !== 'all' && n.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = n.title_bn.toLowerCase().includes(q) || (n.title_en || '').toLowerCase().includes(q);
        const inContent = n.content_bn.toLowerCase().includes(q);
        return inTitle || inContent;
      }
      return true;
    });
  }, [activeNotices, activeCategory, searchQuery]);

  const urgentCount = activeNotices.filter((n) => n.category === 'urgent').length;
  const duesCount = activeNotices.filter((n) => n.category === 'dues').length;

  const getCategoryBadge = (category: NoticeRecord['category']) => {
    switch (category) {
      case 'urgent':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-[11px] gap-1 shadow-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>{language === 'bn' ? 'জরুরি ঘোষণা' : 'Urgent Notice'}</span>
          </Badge>
        );
      case 'dues':
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-[11px] gap-1">
            <CreditCard className="w-3 h-3 text-amber-700" />
            <span>{language === 'bn' ? 'চাঁদা সংক্রান্ত' : 'Dues Notice'}</span>
          </Badge>
        );
      case 'meeting':
        return (
          <Badge className="bg-blue-100 text-blue-900 border-blue-300 font-bold text-[11px] gap-1">
            <Users className="w-3 h-3 text-blue-700" />
            <span>{language === 'bn' ? 'মিটিং ও সভা' : 'Meeting'}</span>
          </Badge>
        );
      case 'event':
        return (
          <Badge className="bg-purple-100 text-purple-900 border-purple-300 font-bold text-[11px] gap-1">
            <Sparkles className="w-3 h-3 text-purple-700" />
            <span>{language === 'bn' ? 'অনুষ্ঠান ও ইভেন্ট' : 'Event'}</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold text-[11px] gap-1">
            <Megaphone className="w-3 h-3 text-emerald-700" />
            <span>{language === 'bn' ? 'সাধারণ নোটিশ' : 'General Notice'}</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0B6B3A] via-[#09572E] to-[#073D20] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-100">
              <Megaphone className="w-3.5 h-3.5 text-[#9BD038]" />
              <span>{language === 'bn' ? 'অফিশিয়াল বুলেটিন বোর্ড' : 'Official Bulletin Board'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight">
              {language === 'bn' ? 'নোটিশ ও ঘোষণা (Notices)' : 'Notices & Announcements'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              {language === 'bn'
                ? 'সংগঠনের সকল কার্যক্রম, মাসিক চাঁদা নির্দেশনা ও জরুরি সিদ্ধান্তের সর্বশেষ নোটিশ।'
                : 'All official notices, dues guidelines, and administrative updates.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl h-10 px-4 text-xs font-bold gap-2 cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Push Notification Setup Banner */}
      {isPushSupported() && (
        <Card className={`rounded-[22px] border-2 transition-all overflow-hidden ${
          pushStatus === 'granted'
            ? 'bg-emerald-500/5 border-emerald-500/30'
            : 'bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-[#0B6B3A]/30'
        }`}>
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                pushStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
                {pushStatus === 'granted' ? (
                  <BellRing className="w-5 h-5 text-emerald-600 animate-bounce" />
                ) : (
                  <Bell className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="font-heading font-black text-sm sm:text-base text-foreground flex items-center gap-2">
                  <span>
                    {pushStatus === 'granted'
                      ? (language === 'bn' ? 'পুশ নোটিফিকেশন চালু রয়েছে' : 'Push Notifications are Active')
                      : (language === 'bn' ? 'মোবাইলে সরাসরি পুশ নোটিফিকেশন পান' : 'Enable Mobile Push Notifications')}
                  </span>
                  {pushStatus === 'granted' && (
                    <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-2 rounded-full">
                      {language === 'bn' ? 'সক্রিয়' : 'Active'}
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pushStatus === 'granted'
                    ? (language === 'bn'
                        ? 'সংগঠনের যেকোনো জরুরি নোটিশ বা বকেয়া রিমাইন্ডার সাথে সাথে আপনার ফোনে চলে যাবে।'
                        : 'You will receive immediate alerts for dues and announcements.')
                    : (language === 'bn'
                        ? 'নোটিফিকেশন সক্রিয় রাখলে অ্যাপ বন্ধ থাকলেও নোটিশ ও চাঁদার রিমাইন্ডার আপনার ফোনে নোটিফিকেশন হিসেবে আসবে।'
                        : 'Receive instant push alerts on this device whenever a notice or reminder is sent.')}
                </p>
              </div>
            </div>

            {pushStatus !== 'granted' && (
              <Button
                type="button"
                onClick={handleEnablePush}
                disabled={isRequestingPush}
                className="bg-[#0B6B3A] hover:bg-[#09572E] text-white font-bold text-xs rounded-xl shadow-md h-10 px-5 gap-2 shrink-0 cursor-pointer"
              >
                <BellRing className="w-4 h-4" />
                <span>{language === 'bn' ? 'নোটিফিকেশন সক্রিয় করুন' : 'Enable Notifications'}</span>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prominent Dues Notification Alert Card if member has unpaid dues */}
      {unpaidMonths.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-300 dark:border-rose-800 rounded-[22px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                  {language === 'bn' ? 'বকেয়া সতর্কতা' : 'Dues Alert'}
                </span>
                <p className="font-heading font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  {language === 'bn' 
                    ? `আপনার ${unpaidMonths.length} মাসের চাঁদা বকেয়া রয়েছে (মোট: ৳${unpaidDues.toLocaleString()})`
                    : `You have ${unpaidMonths.length} unpaid dues pending (Total: ৳${unpaidDues.toLocaleString()})`}
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'সংগঠনের নিয়ম অনুযায়ী মাসিক চাঁদা নিয়মিত পরিশোধ বাধ্যতামূলক। অনলাইনে বিকাশ, নগদ বা রকেটের মাধ্যমে ১ ক্লিকে পরিশোধ করুন।'
                  : 'Please pay your dues promptly via bKash, Nagad, Rocket, or Bank.'}
              </p>
            </div>
          </div>

          <Link
            to="/member/pay-dues"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shrink-0 transition-transform active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>{language === 'bn' ? 'এখনই চাঁদা পরিশোধ করুন' : 'Pay Dues Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-2xl border border-border/60">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            type="button"
            size="sm"
            variant={activeCategory === 'all' ? 'default' : 'ghost'}
            onClick={() => setActiveCategory('all')}
            className={`rounded-xl text-xs font-bold h-8 px-3 ${
              activeCategory === 'all' ? 'bg-[#0B6B3A] text-white hover:bg-[#09572E]' : ''
            }`}
          >
            {language === 'bn' ? `সকল (${activeNotices.length})` : `All (${activeNotices.length})`}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeCategory === 'urgent' ? 'default' : 'ghost'}
            onClick={() => setActiveCategory('urgent')}
            className={`rounded-xl text-xs font-bold h-8 px-3 ${
              activeCategory === 'urgent' ? 'bg-red-600 text-white hover:bg-red-700' : ''
            }`}
          >
            {language === 'bn' ? `জরুরি (${urgentCount})` : `Urgent (${urgentCount})`}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeCategory === 'dues' ? 'default' : 'ghost'}
            onClick={() => setActiveCategory('dues')}
            className={`rounded-xl text-xs font-bold h-8 px-3 ${
              activeCategory === 'dues' ? 'bg-amber-600 text-white hover:bg-amber-700' : ''
            }`}
          >
            {language === 'bn' ? `চাঁদা সংক্রান্ত (${duesCount})` : `Dues (${duesCount})`}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeCategory === 'meeting' ? 'default' : 'ghost'}
            onClick={() => setActiveCategory('meeting')}
            className={`rounded-xl text-xs font-bold h-8 px-3 ${
              activeCategory === 'meeting' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
            }`}
          >
            {language === 'bn' ? 'মিটিং ও সভা' : 'Meetings'}
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'নোটিশ খুঁজুন...' : 'Search notices...'}
            className="pl-9 h-9 rounded-xl text-xs bg-background"
          />
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-16 space-y-3 bg-muted/20 rounded-2xl border border-border/40">
            <RefreshCw className="w-8 h-8 text-[#0B6B3A] animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">
              {language === 'bn' ? 'নোটিশ লোড হচ্ছে...' : 'Loading notices...'}
            </p>
          </div>
        ) : filteredNotices.length === 0 ? (
          <Card className="rounded-[24px] border-dashed border-2 border-border/80 p-8 text-center bg-muted/10">
            <CardContent className="space-y-3 p-0">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Megaphone className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-foreground">
                  {language === 'bn' ? 'কোনো নোটিশ পাওয়া যায়নি' : 'No notices found'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {language === 'bn'
                    ? 'বর্তমানে এই ক্যাটাগরিতে কোনো সক্রিয় নোটিশ নেই।'
                    : 'There are currently no active notices in this category.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNotices.map((notice) => {
            const isUrgent = notice.category === 'urgent';

            return (
              <Card
                key={notice.id}
                className={`rounded-[24px] transition-all overflow-hidden ${
                  isUrgent
                    ? 'border-2 border-red-300 dark:border-red-900 shadow-md bg-gradient-to-br from-red-500/5 to-transparent'
                    : 'border border-border/60 shadow-xs hover:shadow-md hover:border-emerald-600/40'
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(notice.category)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          {format(new Date(notice.created_at), 'dd MMMM yyyy, hh:mm a', {
                            locale: language === 'bn' ? bn : enUS,
                          })}
                        </span>
                      </span>
                    </div>

                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {notice.target_audience === 'executive'
                        ? (language === 'bn' ? 'কার্যনির্বাহী সদস্য' : 'Executive')
                        : (language === 'bn' ? 'সকল সাধারণ সদস্য' : 'All Members')}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className={`text-base sm:text-lg font-heading font-bold ${
                      isUrgent ? 'text-red-700 dark:text-red-400' : 'text-foreground'
                    }`}>
                      {language === 'bn' ? notice.title_bn : (notice.title_en || notice.title_bn)}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {notice.content_bn}
                    </p>
                  </div>

                  {notice.category === 'dues' && (
                    <div className="pt-2">
                      <Link
                        to="/member/pay-dues"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B6B3A] hover:bg-[#09572E] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'অনলাইন চাঁদা পরিশোধ করুন' : 'Pay Dues Online'}</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MemberNoticesPage;

