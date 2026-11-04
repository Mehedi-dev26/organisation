import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Megaphone,
  Plus,
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
  Smartphone
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

  // Form State
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentBn, setContentBn] = useState('');
  const [category, setCategory] = useState<NoticeRecord['category']>('general');
  const [targetAudience, setTargetAudience] = useState<NoticeRecord['target_audience']>('all');
  const [sendSms, setSendSms] = useState(true);
  const [sendPush, setSendPush] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Notices
  const { data: notices = [], isLoading } = useQuery<NoticeRecord[]>({
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

  // Query Approved Members for Audience Count
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

  // Target Members based on audience
  const targetMembers = members.filter((m) => {
    if (targetAudience === 'all') return true;
    if (targetAudience === 'executive') return m.member_type === 'executive' || m.member_type === 'admin';
    return m.member_type === 'general';
  });

  // Calculate live SMS parts for preview
  const smsPreviewText = `[নোটিশ] ${titleBn || 'জরুরি বিজ্ঞপ্তি'}: ${contentBn ? contentBn.slice(0, 100) + '...' : ''} - সময়ের বাতিঘর`;
  const smsParts = calculateSmsParts(smsPreviewText);

  // Save Notices Mutation
  const saveNoticesMutation = useMutation({
    mutationFn: async (updatedNotices: NoticeRecord[]) => {
      try {
        localStorage.setItem('batighor_notices', JSON.stringify(updatedNotices));
      } catch (e) {}

      const { error } = await supabase
        .from('site_settings')
        .upsert(
          {
            key: SETTINGS_KEY_NOTICES,
            value: updatedNotices as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
      return updatedNotices;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([SETTINGS_KEY_NOTICES], data);
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY_NOTICES] });
    },
  });

  // Handle Create and Publish Notice
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim() || !contentBn.trim()) {
      toast({
        title: 'প্রয়োজনীয় তথ্য দিন',
        description: 'নোটিশের শিরোনাম ও বিস্তারিত বিবরণ লিখুন।',
        variant: 'destructive',
      });
      return;
    }

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

    setIsBroadcasting(true);

    try {
      // 1. If SMS broadcast is enabled, send SMS to target members
      if (sendSms && targetMembers.length > 0) {
        const recipients = targetMembers
          .filter((m) => m.phone && m.phone.length >= 10)
          .map((m) => ({
            phone: m.phone,
            name: m.full_name || 'সদস্য',
            memberId: m.id,
            customMessage: `[নোটিশ] ${titleBn.trim()}: ${contentBn.trim().slice(0, 95)}... সময়ের বাতিঘর`,
          }));

        setBroadcastProgress({ current: 0, total: recipients.length });

        await sendBulkSms(
          recipients,
          smsPreviewText,
          'notice',
          (completed, total) => {
            setBroadcastProgress({ current: completed, total });
          }
        );
      }

      // 2. Save notice to database
      const updatedList = [newNotice, ...notices];
      await saveNoticesMutation.mutateAsync(updatedList);

      toast({
        title: language === 'bn' ? 'নোটিশ সফলভাবে প্রকাশিত!' : 'Notice Published!',
        description: language === 'bn'
          ? `নোটিশ প্রকাশিত হয়েছে${sendSms ? ` এবং ${targetMembers.length} জন সদস্যের কাছে এসএমএস পৌঁছে গেছে।` : '।'}`
          : 'Notice created and published.',
      });

      // Reset form & close
      setTitleBn('');
      setTitleEn('');
      setContentBn('');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      toast({
        title: 'ত্রুটি',
        description: err.message || 'নোটিশ সংরক্ষণ করা যায়নি',
        variant: 'destructive',
      });
    } finally {
      setIsBroadcasting(false);
      setBroadcastProgress(null);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই নোটিশটি মুছে ফেলতে চান?')) return;
    const filtered = notices.filter((n) => n.id !== id);
    await saveNoticesMutation.mutateAsync(filtered);
    toast({
      title: 'নোটিশ মুছে ফেলা হয়েছে',
    });
  };

  const filteredNotices = notices.filter((n) =>
    n.title_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content_bn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{language === 'bn' ? 'নোটিশ ও ঘোষণা ব্যবস্থাপনা' : 'Notices & Announcements'}</span>
              <Badge className="bg-purple-600 text-white border-0 text-[11px] font-bold">
                SMS + Push Broadcast
              </Badge>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'সংগঠনের যেকোনো বিজ্ঞপ্তি তৈরি করুন এবং এক ক্লিকে সদস্যদের ফোনে SMS ও ড্যাশবোর্ডে পুশ নোটিফিকেশন পাঠান।'
                : 'Create announcements and broadcast directly via SMS and member portal notifications.'}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl shadow-md gap-2 h-11 px-5"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{language === 'bn' ? 'নতুন নোটিশ ঘোষণা করুন' : 'New Announcement'}</span>
        </Button>
      </div>

      {/* Notices List */}
      <Card className="rounded-3xl border-slate-200/90 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                <span>{language === 'bn' ? 'প্রকাশিত নোটিশ তালিকা' : 'Published Announcements'}</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                ওয়েবসাইট ও সদস্য প্যানেলে সক্রিয় সকল নোটিশ
              </CardDescription>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="নোটিশ খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200">
                        {notice.category === 'urgent' ? '🚨 জরুরি নোটিশ' : notice.category === 'meeting' ? '📅 সাধারণ সভা' : '📢 সাধারণ বিজ্ঞপ্তি'}
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
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <Smartphone className="w-3 h-3" />
                          <span>SMS প্রেরিত</span>
                        </span>
                      )}
                      {notice.send_push && (
                        <span className="inline-flex items-center gap-1 text-purple-600 font-bold">
                          <Bell className="w-3 h-3" />
                          <span>পুশ সক্রিয়</span>
                        </span>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-xs">মুছুন</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Megaphone className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold">কোনো নোটিশ ঘোষণা পাওয়া যায়নি</p>
              <p className="text-xs">উপরের বাটনে ক্লিক করে নতুন নোটিশ প্রকাশ করুন।</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notice Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800">
          <DialogHeader className="p-5 sm:p-6 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/40 dark:to-slate-900 border-b border-purple-100 dark:border-purple-800">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-600" />
              <span>নতুন নোটিশ ও বার্তা সম্প্রচার</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateNotice} className="p-5 sm:p-6 space-y-4">
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

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                বিজ্ঞপ্তির পূর্ণাঙ্গ বিবরণ *
              </Label>
              <Textarea
                rows={5}
                value={contentBn}
                onChange={(e) => setContentBn(e.target.value)}
                placeholder="নোটিশের বিস্তারিত বক্তব্য, তারিখ, সময় ও স্থান সুন্দরভাবে লিখুন..."
                className="text-xs rounded-xl leading-relaxed font-sans"
                required
              />
            </div>

            {/* Delivery Channels */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/60 space-y-2.5">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>বিজ্ঞপ্তি পৌঁছানোর মাধ্যম (Broadcast Channels):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <span>সরাসরি SMS পাঠান ({targetMembers.length} জন)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={sendPush}
                    onChange={(e) => setSendPush(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <span>ড্যাশবোর্ড পুশ নোটিফিকেশন</span>
                </label>
              </div>

              {sendSms && (
                <div className="pt-2 text-[11px] text-purple-800 dark:text-purple-300 flex items-center justify-between border-t border-purple-200/50">
                  <span>প্রাক্কলিত এসএমএস: {smsParts.chars} অক্ষর ({smsParts.parts} পার্ট)</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    আনুমানিক মোট খরচ: ৳{(smsParts.parts * 0.35 * targetMembers.length).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {broadcastProgress && (
              <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>এসএমএস পাঠানো হচ্ছে: {broadcastProgress.current} / {broadcastProgress.total}</span>
              </div>
            )}

            <DialogFooter className="pt-2">
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
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>নোটিশ প্রকাশ ও ব্রডকাস্ট করুন</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoticeManagement;
