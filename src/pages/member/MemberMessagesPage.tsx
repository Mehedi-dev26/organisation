import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMember } from '@/components/member/MemberContext';
import { getSmsDeliveryLogs, SmsLogRecord } from '@/services/smsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Smartphone,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  CreditCard,
  RefreshCw,
  Bell,
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

export const MemberMessagesPage: React.FC = () => {
  const { language } = useLanguage();
  const { memberData, unpaidMonths, unpaidDues } = useMember();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'dues_reminder' | 'notice' | 'other'>('all');

  // Fetch all SMS delivery logs
  const { data: allLogs = [], isLoading, refetch, isFetching } = useQuery<SmsLogRecord[]>({
    queryKey: ['sms-delivery-logs-for-member'],
    queryFn: getSmsDeliveryLogs,
    refetchInterval: 30000, // Refresh every 30s
  });

  // Filter logs specifically sent to this member (by phone or member_id)
  const memberLogs = useMemo(() => {
    if (!memberData) return [];

    const memberPhone = memberData.phone?.replace(/[^0-9]/g, '') || '';
    const last10Digits = memberPhone.slice(-10);
    const memberId = memberData.member_id?.toLowerCase() || '';

    return allLogs.filter((log) => {
      const logPhone = (log.recipientPhone || '').replace(/[^0-9]/g, '');
      const matchPhone = last10Digits && logPhone.endsWith(last10Digits);
      const matchId = memberId && log.memberId?.toLowerCase() === memberId;
      return matchPhone || matchId;
    });
  }, [allLogs, memberData]);

  // Tab and Search Filtering
  const filteredLogs = useMemo(() => {
    return memberLogs.filter((log) => {
      // Tab filter
      if (activeTab === 'dues_reminder' && log.purpose !== 'dues_reminder') return false;
      if (activeTab === 'notice' && log.purpose !== 'notice') return false;
      if (activeTab === 'other' && (log.purpose === 'dues_reminder' || log.purpose === 'notice')) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMsg = log.message.toLowerCase().includes(q);
        const matchesDate = log.createdAt.toLowerCase().includes(q);
        return matchesMsg || matchesDate;
      }

      return true;
    });
  }, [memberLogs, activeTab, searchQuery]);

  // Statistics
  const totalSms = memberLogs.length;
  const duesSmsCount = memberLogs.filter((l) => l.purpose === 'dues_reminder').length;
  const noticeSmsCount = memberLogs.filter((l) => l.purpose === 'notice').length;

  const extractPaymentLink = (text: string): string | null => {
    const match = text.match(/https?:\/\/[^\s]+pay[^\s]*/i) || text.match(/samoyerbatighor\.pro\.bd\/[^\s]+/i);
    if (!match) return null;
    let url = match[0];
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    return url;
  };

  const getPurposeBadge = (purpose: SmsLogRecord['purpose']) => {
    switch (purpose) {
      case 'dues_reminder':
        return (
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-300 font-bold text-[11px] gap-1">
            <CreditCard className="w-3 h-3 text-amber-700" />
            <span>{language === 'bn' ? 'চাঁদা বকেয়া রিমাইন্ডার' : 'Dues Reminder'}</span>
          </Badge>
        );
      case 'notice':
        return (
          <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-300 font-bold text-[11px] gap-1">
            <Bell className="w-3 h-3 text-blue-700" />
            <span>{language === 'bn' ? 'সংগঠনের নোটিশ' : 'Notice'}</span>
          </Badge>
        );
      case 'welcome':
        return (
          <Badge className="bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200 border border-purple-300 font-bold text-[11px] gap-1">
            <Sparkles className="w-3 h-3 text-purple-700" />
            <span>{language === 'bn' ? 'স্বাগতম ও আইডি' : 'Welcome & ID'}</span>
          </Badge>
        );
      case 'payment_approved':
        return (
          <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-300 font-bold text-[11px] gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>{language === 'bn' ? 'পেমেন্ট অনুমোদন' : 'Payment Approved'}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] font-semibold">
            {language === 'bn' ? 'সাধারণ বার্তা' : 'Message'}
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
              <Smartphone className="w-3.5 h-3.5 text-[#9BD038]" />
              <span>{language === 'bn' ? 'এসএমএস গেটওয়ে হিস্ট্রি' : 'SMS Gateway History'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight">
              {language === 'bn' ? 'বার্তা বিবরণী (Message Overview)' : 'Message Overview'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              {language === 'bn'
                ? `সময়ের বাতিঘর থেকে আপনার নিবন্ধিত ফোন নম্বরে (${memberData?.phone || '...'}) পাঠানো সকল অফিশিয়াল SMS ও নোটিফিকেশনের পূর্ণ বিবরণী।`
                : `Complete log of all official SMS notifications dispatched to your mobile phone.`}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="self-start md:self-auto bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl h-10 px-4 text-xs font-bold gap-2 cursor-pointer backdrop-blur-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{language === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh Logs'}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-[20px] border-border/60 shadow-xs">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  {language === 'bn' ? 'মোট প্রাপ্ত এসএমএস' : 'Total SMS Received'}
                </p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalSms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-border/60 shadow-xs">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  {language === 'bn' ? 'বকেয়া রিমাইন্ডার বার্তা' : 'Dues Reminders'}
                </p>
                <p className="text-2xl font-black text-amber-600 mt-0.5">{duesSmsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-border/60 shadow-xs">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  {language === 'bn' ? 'জরুরি নোটিশ এসএমএস' : 'Notice SMS'}
                </p>
                <p className="text-2xl font-black text-blue-600 mt-0.5">{noticeSmsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-2xl border border-border/60">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('all')}
            className={`rounded-xl text-xs font-bold h-8 px-3 ${
              activeTab === 'all' ? 'bg-[#0B6B3A] text-white hover:bg-[#09572E]' : ''
            }`}
          >
            {language === 'bn' ? `সকল (${totalSms})` : `All (${totalSms})`}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === 'dues_reminder' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('dues_reminder')}
            className={`rounded-xl text-xs font-bold h-8 px-3 ${
              activeTab === 'dues_reminder' ? 'bg-amber-600 text-white hover:bg-amber-700' : ''
            }`}
          >
            {language === 'bn' ? `চাঁদা রিমাইন্ডার (${duesSmsCount})` : `Dues (${duesSmsCount})`}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === 'notice' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('notice')}
            className={`rounded-xl text-xs font-bold h-8 px-3 ${
              activeTab === 'notice' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
            }`}
          >
            {language === 'bn' ? `নোটিশ (${noticeSmsCount})` : `Notices (${noticeSmsCount})`}
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'বার্তা দিয়ে খুঁজুন...' : 'Search messages...'}
            className="pl-9 h-9 rounded-xl text-xs bg-background"
          />
        </div>
      </div>

      {/* Message List */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="text-center py-16 space-y-3 bg-muted/20 rounded-2xl border border-border/40">
            <RefreshCw className="w-8 h-8 text-[#0B6B3A] animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">
              {language === 'bn' ? 'এসএমএস হিস্ট্রি লোড হচ্ছে...' : 'Loading message history...'}
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="rounded-[24px] border-dashed border-2 border-border/80 p-8 text-center bg-muted/10">
            <CardContent className="space-y-3 p-0">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-foreground">
                  {language === 'bn' ? 'কোনো বার্তা পাওয়া যায়নি' : 'No messages found'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {language === 'bn'
                    ? 'আপনার মোবাইল নম্বরে সংগঠন থেকে এখনও কোনো এসএমএস পাঠানো হয়নি অথবা ফিল্টারের সাথে মিলছে না।'
                    : 'No SMS messages have been sent to your phone number yet.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const paymentLink = extractPaymentLink(log.message);
            const isDelivered = log.status === 'delivered';

            return (
              <Card
                key={log.id}
                className="rounded-[22px] border-border/60 hover:border-emerald-600/40 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 space-y-3">
                  {/* Top Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPurposeBadge(log.purpose)}
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span>
                          {format(new Date(log.createdAt), 'dd MMMM yyyy, hh:mm a', {
                            locale: language === 'bn' ? bn : enUS,
                          })}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30'
                            : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        <span>{language === 'bn' ? 'মোবাইলে প্রেরিত' : 'Delivered'}</span>
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                        {log.recipientPhone}
                      </span>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-[#F8FAF9] dark:bg-muted/30 border border-emerald-600/15 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-sans leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap select-text">
                    {log.message}
                  </div>

                  {/* Smart Magic Payment Link Action Button */}
                  {paymentLink && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-[#9BD038]" />
                        <span>{language === 'bn' ? 'ওয়ান-টাইম সিকিউর পেমেন্ট লিংক শনাক্ত হয়েছে' : 'One-time secure payment link ready'}</span>
                      </div>
                      <a
                        href={paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B6B3A] hover:bg-[#09572E] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'এই লিংকে সরাসরি পরিশোধ করুন' : 'Pay Directly via Link'}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
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

export default MemberMessagesPage;

