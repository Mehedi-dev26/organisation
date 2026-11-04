import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  BellRing,
  Send,
  Save,
  Sparkles,
  Smartphone,
  Mail,
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Users
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  getSmsGatewaySettings,
  saveSmsGatewaySettings,
  sendBulkSms,
  renderSmsTemplate,
  calculateSmsParts,
  type SmsGatewaySettings,
  DEFAULT_SMS_SETTINGS
} from '@/services/smsService';

interface DuesReminderSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unpaidSummary: Array<{
    member: {
      id: string;
      full_name: string;
      member_id?: string;
      phone?: string;
      email?: string;
    };
    unpaidCount: number;
    totalUnpaid: number;
  }>;
  currentMonthName?: string;
}

export const DuesReminderSetupDialog: React.FC<DuesReminderSetupDialogProps> = ({
  open,
  onOpenChange,
  unpaidSummary,
  currentMonthName = 'চলতি',
}) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{ current: number; total: number } | null>(null);

  // Settings State
  const { data: settings = DEFAULT_SMS_SETTINGS } = useQuery({
    queryKey: ['sms-gateway-settings'],
    queryFn: getSmsGatewaySettings,
  });

  const [localSettings, setLocalSettings] = useState<SmsGatewaySettings>(DEFAULT_SMS_SETTINGS);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Save Settings Mutation
  const saveMutation = useMutation({
    mutationFn: saveSmsGatewaySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-gateway-settings'] });
      toast({
        title: language === 'bn' ? 'সংরক্ষিত!' : 'Saved!',
        description: language === 'bn'
          ? 'স্বয়ংক্রিয় বকেয়া রিমাইন্ডার শিডিউল ও টেমপ্লেট সংরক্ষিত হয়েছে।'
          : 'Dues reminder schedule and template saved.',
      });
    },
  });

  // Calculate live SMS parts for the template
  const sampleData = {
    name: unpaidSummary[0]?.member?.full_name || 'মোঃ কামরুল হাসান',
    member_id: unpaidSummary[0]?.member?.member_id || '01',
    month: currentMonthName,
    amount: unpaidSummary[0]?.totalUnpaid || 100,
    org_name: 'সময়ের বাতিঘর',
    payment_link: 'batighor.org/payment',
  };

  const previewSmsText = renderSmsTemplate(localSettings.duesSmsTemplate, sampleData);
  const smsParts = calculateSmsParts(previewSmsText);

  // Instant Broadcast Now to All Currently Unpaid Members
  const handleBroadcastInstantReminders = async () => {
    const validRecipients = unpaidSummary
      .filter((s) => s.member?.phone && s.member.phone.length >= 10)
      .map((s) => {
        const text = renderSmsTemplate(localSettings.duesSmsTemplate, {
          name: s.member.full_name,
          member_id: s.member.member_id || 'N/A',
          month: currentMonthName,
          amount: s.totalUnpaid,
          org_name: 'সময়ের বাতিঘর',
          payment_link: 'https://batighor.org/payment',
        });

        return {
          phone: s.member.phone!,
          name: s.member.full_name,
          memberId: s.member.member_id,
          customMessage: text,
        };
      });

    if (validRecipients.length === 0) {
      toast({
        title: 'কোনো প্রাপক পাওয়া যায়নি',
        description: 'কোনো বকেয়া সদস্যের বৈধ ফোন নম্বর নেই অথবা সবার চাঁদা পরিশোধিত।',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm(`আপনি কি ${validRecipients.length} জন বকেয়া সদস্যকে এই মুহূর্তে ব্যক্তিগত SMS রিমাইন্ডার পাঠাতে চান?`)) {
      return;
    }

    setIsBroadcasting(true);
    setBroadcastProgress({ current: 0, total: validRecipients.length });

    try {
      const result = await sendBulkSms(
        validRecipients,
        previewSmsText,
        'dues_reminder',
        (completed, total) => {
          setBroadcastProgress({ current: completed, total });
        }
      );

      toast({
        title: language === 'bn' ? 'রিমাইন্ডার ব্রডকাস্ট সম্পন্ন!' : 'Reminders Sent!',
        description: language === 'bn'
          ? `মোট ${result.successCount} জন সদস্যকে সফলভাবে SMS পাঠানো হয়েছে (মোট খরচ: ৳${result.totalCost})।`
          : `Sent ${result.successCount} SMS. Total cost: BDT ${result.totalCost}`,
      });

      queryClient.invalidateQueries({ queryKey: ['sms-delivery-logs'] });
    } catch (err: any) {
      toast({
        title: 'ব্রডকাস্ট ত্রুটি',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsBroadcasting(false);
      setBroadcastProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:to-slate-900 border-b border-emerald-100 dark:border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center shadow-xs">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'bn' ? 'স্বয়ংক্রিয় বকেয়া চাঁদা রিমাইন্ডার সেটআপ' : 'Automated Dues Reminder Setup'}</span>
                <Badge className="bg-emerald-600 text-white border-0 text-[10px] font-bold">
                  SMS + Push
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                প্রতি মাসের নির্দিষ্ট তারিখে বকেয়া সদস্যদের ফোনে স্বয়ংক্রিয় SMS ও পুশ নোটিফিকেশন পাঠানোর শিডিউল।
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Section 1: Auto Schedule Switches */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'স্বয়ংক্রিয় রিমাইন্ডার শিডিউল' : 'Automated Reminder Schedule'}</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  নির্ধারিত তারিখে সিস্টেম স্বয়ংক্রিয়ভাবে বকেয়া সদস্যদের শনাক্ত করে রিমাইন্ডার পাঠাবে।
                </p>
              </div>

              <Switch
                checked={localSettings.autoDuesReminderEnabled}
                onCheckedChange={(val) => setLocalSettings((prev) => ({ ...prev, autoDuesReminderEnabled: val }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  মাসের কত তারিখে রিমাইন্ডার যাবে?
                </Label>
                <select
                  value={localSettings.autoDuesReminderDayOfMonth}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, autoDuesReminderDayOfMonth: parseInt(e.target.value) || 1 }))}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value={1}>১ তারিখে (মাসের শুরুতে - আদর্শ)</option>
                  <option value={5}>৫ তারিখে (৫ দিন পর)</option>
                  <option value={10}>১০ তারিখে (প্রথম সপ্তাহ শেষে)</option>
                  <option value={15}>১৫ তারিখে (মাসের মাঝামাঝি)</option>
                  <option value={25}>২৫ তারিখে (মাসের শেষে চূড়ান্ত তাগাদা)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  রিমাইন্ডার প্রেরণের মাধ্যম (Channels)
                </Label>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.duesNotificationChannels.sms}
                      onChange={(e) => setLocalSettings((prev) => ({
                        ...prev,
                        duesNotificationChannels: { ...prev.duesNotificationChannels, sms: e.target.checked }
                      }))}
                      className="rounded text-emerald-600"
                    />
                    <span>SMS</span>
                  </label>

                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.duesNotificationChannels.push}
                      onChange={(e) => setLocalSettings((prev) => ({
                        ...prev,
                        duesNotificationChannels: { ...prev.duesNotificationChannels, push: e.target.checked }
                      }))}
                      className="rounded text-emerald-600"
                    />
                    <span>পুশ নোটিফিকেশন</span>
                  </label>

                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.duesNotificationChannels.email}
                      onChange={(e) => setLocalSettings((prev) => ({
                        ...prev,
                        duesNotificationChannels: { ...prev.duesNotificationChannels, email: e.target.checked }
                      }))}
                      className="rounded text-emerald-600"
                    />
                    <span>ইমেইল</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic SMS Format & Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>ডায়নামিক এসএমএস ফরম্যাট (SMS Template)</span>
              </Label>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {smsParts.chars} অক্ষর ({smsParts.parts} পার্ট)
              </span>
            </div>

            <Textarea
              rows={4}
              value={localSettings.duesSmsTemplate}
              onChange={(e) => setLocalSettings((prev) => ({ ...prev, duesSmsTemplate: e.target.value }))}
              className="text-xs rounded-xl font-sans leading-relaxed"
            />

            {/* Variable tags pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-slate-400 font-bold">ভ্যারিয়েবল ট্যাগ:</span>
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {'{name}'}
              </code>
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {'{member_id}'}
              </code>
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {'{month}'}
              </code>
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {'{amount}'}
              </code>
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {'{payment_link}'}
              </code>
            </div>

            {/* Live Message Preview */}
            <div className="mt-2 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50 text-xs">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                📱 সদস্যের ফোনে যেভাবে মেসেজটি যাবে (লাইভ প্রিভিউ):
              </span>
              <p className="text-slate-700 dark:text-slate-200 italic font-sans leading-relaxed">
                "{previewSmsText}"
              </p>
            </div>
          </div>

          {/* Section 3: Instant Broadcast Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/30 dark:to-slate-900 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-purple-950 dark:text-purple-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>তাত্ক্ষণিক রিমাইন্ডার সম্প্রচার (Instant Broadcast)</span>
              </h4>
              <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                বর্তমানে মোট <strong className="font-black text-purple-900 dark:text-purple-200">{unpaidSummary.length} জন সদস্যের</strong> চাঁদা বকেয়া রয়েছে। এখনই সকলকে তাগাদা মেসেজ পাঠাতে পারেন।
              </p>
            </div>

            <Button
              type="button"
              onClick={handleBroadcastInstantReminders}
              disabled={isBroadcasting || unpaidSummary.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 shrink-0 h-10 px-4"
            >
              {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>এখনই সকলকে SMS পাঠান</span>
            </Button>
          </div>

          {broadcastProgress && (
            <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>রিমাইন্ডার পাঠানো হচ্ছে: {broadcastProgress.current} / {broadcastProgress.total}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold"
          >
            বন্ধ করুন
          </Button>

          <Button
            type="button"
            onClick={() => saveMutation.mutate(localSettings)}
            disabled={saveMutation.isPending}
            className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl shadow-md gap-2 px-5"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>রিমাইন্ডার কনফিগারেশন সংরক্ষণ করুন</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
