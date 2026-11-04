import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Megaphone,
  PlusCircle,
  Send,
  Trash2,
  Calendar,
  Users,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Search,
  ExternalLink,
  Smartphone,
  RefreshCw,
  Eye,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { sendBulkSms, calculateSmsParts } from '@/services/smsService';
import { format } from 'date-fns';

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

export const NoticeManagement: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{ current: number; total: number } | null>(null);
  const [previewNotice, setPreviewNotice] = useState<NoticeRecord | null>(null);

  // Form State
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentBn, setContentBn] = useState('');
  const [category, setCategory] = useState<NoticeRecord['category']>('general');
  const [targetAudience, setTargetAudience] = useState<NoticeRecord['target_audience']>('all');
  const [sendSms, setSendSms] = useState(true);
  const [sendPush, setSendPush] = useState(true);

  // Search and Tab filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'meeting' | 'dues'>('all');

  // Fetch Notices from site_settings
  const { data: notices = [], isLoading, refetch: refetchNotices } = useQuery<NoticeRecord[]>({
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
        const cached = localStorage.getItem('batighor_notices');
        return cached ? JSON.parse(cached) : [];
      }
    },
  });

  // Query Approved Members for Audience Targeting
  const { data: members = [] } = useQuery({
    queryKey: ['notice-audience-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, phone, member_type, status')
        .eq('status', 'approved');
      if (error) return [];
      return data || [];
    },
  });

  // Target Members based on audience selection
  const targetMembers = members.filter((m) => {
    if (targetAudience === 'all') return true;
    if (targetAudience === 'executive') return m.member_type === 'executive' || m.member_type === 'admin';
    return m.member_type === 'general';
  });

  const smsParts = calculateSmsParts(contentBn);

  // Save Notices helper
  const saveNoticesList = async (updated: NoticeRecord[]) => {
    localStorage.setItem('batighor_notices', JSON.stringify(updated));
    await supabase
      .from('site_settings')
      .upsert(
        {
          key: SETTINGS_KEY_NOTICES,
          value: updated as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    queryClient.setQueryData([SETTINGS_KEY_NOTICES], updated);
  };

  // Create Notice & Broadcast Handler
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleBn.trim() || !contentBn.trim()) {
      toast({
        title: 'প্রয়োজনীয় ফিল্ড পূরণ করুন',
        description: 'নোটিশের শিরোনাম ও বিস্তারিত বক্তব্য লিখুন।',
        variant: 'destructive',
      });
      return;
    }

    setIsBroadcasting(true);

    try {
      const newNotice: NoticeRecord = {
        id: `notice-${Date.now()}`,
        title_bn: titleBn.trim(),
        title_en: titleEn.trim() || titleBn.trim(),
        content_bn: contentBn.trim(),
        category,
        target_audience: targetAudience,
        send_sms: sendSms,
        send_push: sendPush,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      // 1. Send SMS Broadcast if selected
      let smsResult: { successCount: number; failureCount: number; errors: string[] } | null = null;
      if (sendSms && targetMembers.length > 0) {
        const recipients = targetMembers
          .filter((m) => m.phone && m.phone.trim().length >= 10)
          .map((m) => ({
            phone: m.phone!,
            name: m.full_name,
            memberId: m.id,
            customMessage: `[সময়ের বাতিঘর]\n${titleBn.trim()}\n${contentBn.trim()}`,
          }));

        if (recipients.length > 0) {
          smsResult = await sendBulkSms(
            recipients,
            contentBn.trim(),
            'notice',
            (completed, total) => {
              setBroadcastProgress({ current: completed, total });
            }
          );
        }
      }

      // 2. Also publish to news/notice feed in DB for public visibility if desired
      try {
        await supabase.from('news').insert({
          title_bn: titleBn.trim(),
          title_en: titleEn.trim() || null,
          content_bn: contentBn.trim(),
          content_en: null,
          is_published: true,
          published_at: new Date().toISOString(),
        });
      } catch (newsErr) {
        console.warn('News publish optional step warning:', newsErr);
      }

      // 3. Save to organization notices in site_settings
      const updatedList = [newNotice, ...notices];
      await saveNoticesList(updatedList);

      // Reset form
      setTitleBn('');
      setTitleEn('');
      setContentBn('');
      setIsCreateModalOpen(false);

      if (smsResult && smsResult.failureCount > 0) {
        toast({
          title: 'নোটিশ প্রকাশিত হয়েছে (আংশিক এসএমএস ব্যর্থ)',
          description: `নোটিশ সেভ হয়েছে। এসএমএস সফল: ${smsResult.successCount}, ব্যর্থ: ${smsResult.failureCount}। ${smsResult.errors[0] || ''}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: language === 'bn' ? 'নোটিশ সফলভাবে সম্প্রচার হয়েছে!' : 'Notice Published Successfully!',
          description: sendSms 
            ? `${targetMembers.length} জন সদস্যের কাছে এসএমএস ও নোটিফিকেশন পাঠানো হয়েছে।`
            : 'ওয়েবসাইট ও সদস্য ড্যাশবোর্ডে নোটিশ যুক্ত হয়েছে।',
        });
      }

    } catch (err: any) {
      toast({
        title: 'বিজ্ঞপ্তি প্রকাশ ব্যর্থ',
        description: err.message || 'নোটিশ সংরক্ষণ বা সম্প্রচারে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setIsBroadcasting(false);
      setBroadcastProgress(null);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই নোটিশটি মুছে ফেলতে চান?')) return;

    try {
      const updated = notices.filter((n) => n.id !== noticeId);
      await saveNoticesList(updated);
      toast({
        title: 'নোটিশ মুছে ফেলা হয়েছে',
      });
    } catch (err: any) {
      toast({
        title: 'মুছে ফেলতে ব্যর্থ',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Filtered Notices
  const filteredNotices = notices.filter((notice) => {
    const matchesSearch = 
      notice.title_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content_bn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || notice.category === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Top Header - Consistent with Finance & Members Management */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#14231B] dark:text-foreground flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#0B6B3A]">
              <Megaphone className="w-5 h-5" />
            </div>
            <span>{language === 'bn' ? 'নোটিশ ও ঘোষণা ব্যবস্থাপনা' : 'Notice & Announcements'}</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {language === 'bn'
              ? 'সংগঠনের সকল সদস্যের জন্য জরুরি ঘোষণা, সাধারণ সভা, চাঁদা সংক্রান্ত নোটিশ ও এসএমএস সম্প্রচার নিয়ন্ত্রণ করুন'
              : 'Broadcast organizational announcements to members via Web, Dashboard Push & Bulk SMS.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchNotices()}
            className="gap-1.5 border-emerald-200 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </Button>

          {/* Primary Action Button - Styled matching FinanceManagement openAddModal */}
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#0B6B3A] hover:bg-[#09542e] text-white gap-1.5 shadow-sm font-medium"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.4]" />
            <span>{language === 'bn' ? 'নতুন নোটিশ ঘোষণা করুন' : 'Announce Notice'}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">মোট নোটিশ সংখ্যা</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{notices.length}</h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">সংরক্ষিত ও সক্রিয়</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">এসএমএস সম্প্রচারিত</p>
              <h3 className="text-2xl font-black text-blue-600 mt-1">
                {notices.filter((n) => n.send_sms).length}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">সরাসরি মোবাইলে প্রেরিত</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">জরুরি নোটিশ</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                {notices.filter((n) => n.category === 'urgent').length}
              </h3>
              <p className="text-[11px] text-rose-600 font-bold mt-0.5">অগ্রাধিকার ভিত্তিতে</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">টার্গেট সদস্য সংখ্যা</p>
              <h3 className="text-2xl font-black text-purple-600 mt-1">{members.length}</h3>
              <p className="text-[11px] text-purple-600 font-bold mt-0.5">ব্রডকাস্টের জন্য প্রস্তুত</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all' 
                    ? 'bg-white dark:bg-slate-900 text-[#0B6B3A] shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                সকল ({notices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('urgent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'urgent' 
                    ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                জরুরি
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('meeting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'meeting' 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                মিটিং / সভা
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dues')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'dues' 
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                চাঁদা সংক্রান্ত
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="শিরোনাম বা বিষয়বস্তু খুঁজুন..."
                className="pl-8 text-xs rounded-xl h-9 w-52 sm:w-64"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          {filteredNotices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        notice.category === 'urgent'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : notice.category === 'meeting'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : notice.category === 'dues'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {notice.category === 'urgent' ? '🚨 জরুরি নোটিশ' : notice.category === 'meeting' ? '📅 সাধারণ সভা' : notice.category === 'dues' ? '💰 চাঁদা সংক্রান্ত' : '📢 সাধারণ বিজ্ঞপ্তি'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {notice.created_at ? format(new Date(notice.created_at), 'dd MMM yyyy, hh:mm a') : ''}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                      {notice.title_bn}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {notice.content_bn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                    <div className="flex items-center gap-2">
                      {notice.send_sms && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          <Smartphone className="w-3 h-3 text-emerald-600" />
                          <span>SMS প্রেরিত</span>
                        </span>
                      )}
                      {notice.send_push && (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          <Bell className="w-3 h-3 text-blue-600" />
                          <span>পুশ সক্রিয়</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewNotice(notice)}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-8 px-2.5 rounded-lg text-xs font-bold gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>বিস্তারিত</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2.5 rounded-lg text-xs font-bold gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Megaphone className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold">কোনো নোটিশ ঘোষণা পাওয়া যায়নি</p>
              <p className="text-xs">উপরের "নতুন নোটিশ ঘোষণা করুন" বাটনে ক্লিক করে নতুন বিজ্ঞপ্তি প্রকাশ করুন।</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Create Notice Dialog (Exact Style as FinanceManagement.tsx) */}
      {/* ============================================================ */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#14231B] dark:text-foreground">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#0B6B3A]">
                <Megaphone className="w-5 h-5" />
              </div>
              <span>{language === 'bn' ? 'নতুন নোটিশ ঘোষণা ও সম্প্রচার' : 'Publish New Notice'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {language === 'bn' 
                ? 'সময়ের বাতিঘরের সদস্যদের জন্য গুরুত্বপূর্ণ বিজ্ঞপ্তি, জরুরি নোটিশ অথবা সাধারণ সভার ঘোষণা প্রদান করুন' 
                : 'Broadcast announcement to members via Web, Dashboard Push & Bulk SMS'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNotice} className="space-y-4 pt-2">
            
            {/* Title Bn */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                নোটিশ শিরোনাম (বাংলা) *
              </Label>
              <Input
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="যেমন: জরুরি সাধারণ সভা প্রসঙ্গে অথবা মাসিক চাঁদা সংক্রান্ত বিজ্ঞপ্তি"
                className="text-xs font-bold rounded-xl"
                required
              />
            </div>

            {/* Category & Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  বিজ্ঞপ্তির ধরন (Category)
                </Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="general">📢 সাধারণ বিজ্ঞপ্তি</option>
                  <option value="urgent">🚨 জরুরি নোটিশ</option>
                  <option value="meeting">📅 সাধারণ সভা / মিটিং</option>
                  <option value="dues">💰 চাঁদা ও আর্থিক বিজ্ঞপ্তি</option>
                  <option value="event">🎉 ইভেন্ট বা কর্মসূচি</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  টার্গেট সদস্য গ্রুপ (Audience)
                </Label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="all">সকল অনুমোদিত সদস্য ({members.length} জন)</option>
                  <option value="executive">শুধুমাত্র কার্যনির্বাহী কমিটি</option>
                  <option value="general_members">সাধারণ সদস্যবৃন্দ</option>
                </select>
              </div>
            </div>

            {/* Full Message */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                বিজ্ঞপ্তির পূর্ণাঙ্গ বক্তব্য ও বিবরণ *
              </Label>
              <Textarea
                rows={5}
                value={contentBn}
                onChange={(e) => setContentBn(e.target.value)}
                placeholder="নোটিশের বিস্তারিত বক্তব্য, তারিখ, সময় ও স্থান স্পষ্টভাবে লিখুন..."
                className="text-xs rounded-xl leading-relaxed font-sans"
                required
              />
            </div>

            {/* Delivery Channels */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60 space-y-2.5">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>বিজ্ঞপ্তি পৌঁছানোর মাধ্যম (Broadcast Channels):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold shadow-2xs">
                  <input
                    type="checkbox"
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>সরাসরি SMS পাঠান ({targetMembers.length} জন)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold shadow-2xs">
                  <input
                    type="checkbox"
                    checked={sendPush}
                    onChange={(e) => setSendPush(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>ড্যাশবোর্ড পুশ নোটিফিকেশন</span>
                </label>
              </div>

              {sendSms && (
                <div className="pt-2 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center justify-between border-t border-emerald-200/50">
                  <span>প্রাক্কলিত এসএমএস: {smsParts.chars} অক্ষর ({smsParts.parts} পার্ট)</span>
                  <span className="font-bold text-[#0B6B3A]">
                    আনুমানিক মোট খরচ: ৳{(smsParts.parts * 0.35 * targetMembers.length).toFixed(2)} BDT
                  </span>
                </div>
              )}
            </div>

            {/* Progress indicator */}
            {broadcastProgress && (
              <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>এসএমএস পাঠানো হচ্ছে: {broadcastProgress.current} / {broadcastProgress.total}</span>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isBroadcasting}
                className="rounded-xl text-xs font-bold"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={isBroadcasting}
                className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>নোটিশ প্রকাশ ও ব্রডকাস্ট করুন</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewNotice && (
        <Dialog open={!!previewNotice} onOpenChange={() => setPreviewNotice(null)}>
          <DialogContent className="max-w-lg rounded-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {previewNotice.category === 'urgent' ? '🚨 জরুরি' : '📢 নোটিশ'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {previewNotice.created_at ? format(new Date(previewNotice.created_at), 'dd MMM yyyy, hh:mm a') : ''}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white pt-2 leading-snug">
                {previewNotice.title_bn}
              </DialogTitle>
            </DialogHeader>

            <div className="py-3 text-xs leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {previewNotice.content_bn}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewNotice(null)}
                className="rounded-xl text-xs font-bold"
              >
                বন্ধ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default NoticeManagement;
