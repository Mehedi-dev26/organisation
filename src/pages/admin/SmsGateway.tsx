import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare,
  Send,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  PhoneCall,
  Users,
  ShieldCheck,
  Loader2,
  FileText,
  HelpCircle,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getSmsGatewaySettings,
  saveSmsGatewaySettings,
  getSmsDeliveryLogs,
  checkGatewayBalance,
  sendSingleSms,
  calculateSmsParts,
  type SmsGatewaySettings,
  type SmsLogRecord,
  DEFAULT_SMS_SETTINGS
} from '@/services/smsService';
import { format } from 'date-fns';

export const SmsGateway: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showApiKey, setShowApiKey] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [gatewayBalance, setGatewayBalance] = useState<number | null>(null);

  // Test SMS State
  const [testPhone, setTestPhone] = useState('');
  const [testName, setTestName] = useState('');
  const [testMessage, setTestMessage] = useState('সময়ের বাতিঘর টেস্ট এসএমএস। গেটওয়ে সফলভাবে কানেক্টেড রয়েছে।');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Search in logs
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'dues_reminder' | 'notice' | 'test'>('all');

  // Query Settings
  const { data: settings = DEFAULT_SMS_SETTINGS, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['sms-gateway-settings'],
    queryFn: getSmsGatewaySettings,
  });

  const [formSettings, setFormSettings] = useState<SmsGatewaySettings>(DEFAULT_SMS_SETTINGS);

  useEffect(() => {
    if (settings) {
      setFormSettings(settings);
    }
  }, [settings]);

  // Query Logs
  const { data: logs = [], isLoading: isLogsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['sms-delivery-logs'],
    queryFn: getSmsDeliveryLogs,
    refetchInterval: 20000,
  });

  // Query Members count for analytics
  const { data: totalMembers = 0 } = useQuery({
    queryKey: ['admin-active-members-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
      if (error) return 0;
      return count || 0;
    },
  });

  // Save Settings Mutation
  const saveMutation = useMutation({
    mutationFn: saveSmsGatewaySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-gateway-settings'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? 'এসএমএস গেটওয়ে সেটিংস সফলভাবে সংরক্ষিত ও লাইভ কার্যকর হয়েছে।'
          : 'SMS Gateway settings updated successfully.',
      });
    },
    onError: (err: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message || 'সংরক্ষণ ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    },
  });

  // Check Balance
  const handleCheckBalance = async () => {
    setIsCheckingBalance(true);
    try {
      const res = await checkGatewayBalance(formSettings);
      setGatewayBalance(res.balance);
      toast({
        title: language === 'bn' ? 'ব্যালেন্স আপডেট' : 'Balance Updated',
        description: language === 'bn' 
          ? `বর্তমান রিচার্জ ব্যালেন্স: ৳${res.balance.toFixed(2)}`
          : `Current balance: BDT ${res.balance.toFixed(2)}`,
      });
    } catch (err: any) {
      toast({
        title: 'ব্যালেন্স দেখতে ব্যর্থ',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Send Test SMS
  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) {
      toast({
        title: 'প্রয়োজনীয় তথ্য দিন',
        description: 'মোবাইল নম্বর ও মেসেজ লিখুন',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await sendSingleSms(
        testPhone.trim(),
        testName.trim() || 'টেস্ট প্রাপক',
        testMessage.trim(),
        'test'
      );

      if (res.success) {
        toast({
          title: language === 'bn' ? 'টেস্ট এসএমএস প্রেরিত!' : 'Test SMS Sent!',
          description: language === 'bn' 
            ? `${testPhone} নম্বরে সফলভাবে পাঠানো হয়েছে। লগ রেকর্ড যুক্ত হয়েছে।`
            : `SMS delivered to ${testPhone}. Log recorded.`,
        });
        refetchLogs();
      } else {
        toast({
          title: 'এসএমএস ব্যর্থ',
          description: res.message || 'গেটওয়ে সাড়া দেয়নি',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'ত্রুটি',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Summary Metrics
  const totalSentCount = logs.length;
  const successfulCount = logs.filter((l) => l.status === 'delivered').length;
  const successRate = totalSentCount > 0 ? Math.round((successfulCount / totalSentCount) * 100) : 100;
  const totalCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0);

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.recipientPhone.includes(logSearch) ||
      log.recipientName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.message.toLowerCase().includes(logSearch.toLowerCase());

    const matchesFilter = logFilter === 'all' || log.purpose === logFilter;

    return matchesSearch && matchesFilter;
  });

  const testSmsParts = calculateSmsParts(testMessage);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{language === 'bn' ? 'এসএমএস গেটওয়ে ও অটোমেশন' : 'SMS Gateway & Automation'}</span>
              <Badge className="bg-emerald-600 text-white border-0 text-[11px] font-bold">
                Bulk SMS BD
              </Badge>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn' 
                ? 'সদস্যদের নোটিশ ঘোষণা, বকেয়া চাঁদা রিমাইন্ডার এবং তাৎক্ষণিক বাল্ক এসএমএস সম্প্রচার।' 
                : 'Broadcast notices, automated dues payment reminders, and live gateway cost analysis.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleCheckBalance}
            disabled={isCheckingBalance}
            className="rounded-xl border-slate-300 dark:border-slate-700 font-bold text-xs gap-1.5 shadow-2xs"
          >
            {isCheckingBalance ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>
              {gatewayBalance !== null 
                ? `ব্যালেন্স: ৳${gatewayBalance.toFixed(2)}` 
                : (language === 'bn' ? 'ব্যালেন্স চেক করুন' : 'Check Balance')}
            </span>
          </Button>

          <Button
            onClick={() => saveMutation.mutate(formSettings)}
            disabled={saveMutation.isPending}
            className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl shadow-md gap-1.5"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{language === 'bn' ? 'সেটিংস সেভ করুন' : 'Save Settings'}</span>
          </Button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total SMS Dispatched */}
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{language === 'bn' ? 'মোট প্রেরিত এসএমএস' : 'Total Sent'}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalSentCount}</h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">সব চ্যানেল অন্তর্ভুক্ত</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{language === 'bn' ? 'মোট আনুমানিক খরচ' : 'Total Cost'}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">৳{totalCost.toFixed(2)}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">@ ৳{formSettings.costPerSms} / পার্ট</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Success Delivery Rate */}
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{language === 'bn' ? 'সফল ডেলিভারি হার' : 'Success Rate'}</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{successRate}%</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{successfulCount} সফল / {totalSentCount - successfulCount} ব্যর্থ</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Registered Active Members */}
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{language === 'bn' ? 'কভারেজ সদস্য সংখ্যা' : 'Active Members'}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalMembers}</h3>
              <p className="text-[11px] text-purple-600 font-bold mt-0.5">ব্রডকাস্টের জন্য প্রস্তুত</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Gateway Configuration (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl border-slate-200/90 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>{language === 'bn' ? 'বাল্ক এসএমএস বিডি (Bulk SMS BD) গেটওয়ে কনফিগারেশন' : 'Gateway Configuration'}</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {language === 'bn' ? 'আপনার বাল্ক এসএমএস বিডি অ্যাকাউন্ট থেকে API Key ও Sender ID দিন।' : 'Enter your Bulk SMS BD credentials.'}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {formSettings.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                  <Switch
                    checked={formSettings.isActive}
                    onCheckedChange={(val) => setFormSettings((prev) => ({ ...prev, isActive: val }))}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              
              {/* Provider Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    গেটওয়ে প্রোভাইডার (Provider)
                  </Label>
                  <Input
                    value="Bulk SMS BD (bulksmsbd.net)"
                    disabled
                    className="font-bold text-xs bg-slate-50 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    সেন্ডার আইডি / মাস্কিং নাম (Sender ID)
                  </Label>
                  <Input
                    value={formSettings.senderId}
                    onChange={(e) => setFormSettings((prev) => ({ ...prev, senderId: e.target.value }))}
                    placeholder="যেমন: SomoyerBatighor অথবা নন-মাস্কিং"
                    className="text-xs font-bold rounded-xl"
                  />
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    API Key (গোপন এপিআই কী)
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showApiKey ? 'লুকান' : 'দেখুন'}</span>
                  </button>
                </div>
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={formSettings.apiKey}
                  onChange={(e) => setFormSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Bulk SMS BD থেকে প্রাপ্ত API Key পেস্ট করুন"
                  className="font-mono text-xs rounded-xl"
                />
              </div>

              {/* API Endpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    এসএমএস পাঠানোর URL (API Endpoint)
                  </Label>
                  <Input
                    value={formSettings.apiUrl}
                    onChange={(e) => setFormSettings((prev) => ({ ...prev, apiUrl: e.target.value }))}
                    className="font-mono text-[11px] rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ব্যালেন্স চেক API URL
                  </Label>
                  <Input
                    value={formSettings.balanceEndpoint}
                    onChange={(e) => setFormSettings((prev) => ({ ...prev, balanceEndpoint: e.target.value }))}
                    className="font-mono text-[11px] rounded-xl"
                  />
                </div>
              </div>

              {/* Cost & Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    প্রতি এসএমএস রেট (BDT)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formSettings.costPerSms}
                    onChange={(e) => setFormSettings((prev) => ({ ...prev, costPerSms: parseFloat(e.target.value) || 0.35 }))}
                    className="font-bold text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    লো-ব্যালেন্স অ্যালার্ট থ্রেশহোল্ড (BDT)
                  </Label>
                  <Input
                    type="number"
                    value={formSettings.lowBalanceAlertThreshold}
                    onChange={(e) => setFormSettings((prev) => ({ ...prev, lowBalanceAlertThreshold: parseFloat(e.target.value) || 50 }))}
                    className="font-bold text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Auto Dues Reminder Automation Options */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'bn' ? 'স্বয়ংক্রিয় বকেয়া চাঁদা রিমাইন্ডার' : 'Auto Dues Reminder Automation'}</span>
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      প্রতি মাসের নির্দিষ্ট তারিখে বকেয়া সদস্যদের কাছে স্বয়ংক্রিয়ভাবে রিমাইন্ডার পৌঁছে যাবে।
                    </p>
                  </div>
                  <Switch
                    checked={formSettings.autoDuesReminderEnabled}
                    onCheckedChange={(val) => setFormSettings((prev) => ({ ...prev, autoDuesReminderEnabled: val }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={formSettings.duesNotificationChannels.sms}
                      onChange={(e) => setFormSettings((prev) => ({
                        ...prev,
                        duesNotificationChannels: { ...prev.duesNotificationChannels, sms: e.target.checked }
                      }))}
                      className="rounded text-emerald-600"
                    />
                    <span>এসএমএস (SMS)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={formSettings.duesNotificationChannels.push}
                      onChange={(e) => setFormSettings((prev) => ({
                        ...prev,
                        duesNotificationChannels: { ...prev.duesNotificationChannels, push: e.target.checked }
                      }))}
                      className="rounded text-emerald-600"
                    />
                    <span>পুশ নোটিফিকেশন</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={formSettings.duesNotificationChannels.email}
                      onChange={(e) => setFormSettings((prev) => ({
                        ...prev,
                        duesNotificationChannels: { ...prev.duesNotificationChannels, email: e.target.checked }
                      }))}
                      className="rounded text-emerald-600"
                    />
                    <span>ইমেইল (Email)</span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <Button
                type="button"
                onClick={() => saveMutation.mutate(formSettings)}
                disabled={saveMutation.isPending}
                className="w-full bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold h-11 rounded-xl shadow-md gap-2 cursor-pointer"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{language === 'bn' ? 'এসএমএস গেটওয়ে কনফিগারেশন সংরক্ষণ করুন' : 'Save Gateway Settings'}</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Test SMS Composer (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-3xl border-slate-200/90 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 p-5">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <span>{language === 'bn' ? 'তাৎক্ষণিক টেস্ট এসএমএস পাঠান' : 'Send Test SMS'}</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                যেকোনো বাংলাদেশি মোবাইল নম্বরে সরাসরি টেস্ট এসএমএস পাঠিয়ে যাচাই করুন।
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleSendTestSms} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    প্রাপকের ফোন নম্বর
                  </Label>
                  <Input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="যেমন: 01712345678"
                    className="font-mono text-xs font-bold rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    প্রাপকের নাম (ঐচ্ছিক)
                  </Label>
                  <Input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="যেমন: মোঃ সাকিব হাসান"
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      মেসেজ কনটেন্ট
                    </Label>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      {testSmsParts.chars} অক্ষর ({testSmsParts.parts} পার্ট)
                    </span>
                  </div>
                  <Textarea
                    rows={4}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="text-xs rounded-xl leading-relaxed font-sans"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>বাংলা ইউনিকোড: ৭০ অক্ষরের বেশি হলে ২ পার্ট হবে</span>
                    <span className="font-bold text-emerald-600">খরচ: ৳{(testSmsParts.parts * formSettings.costPerSms).toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSendingTest}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-md gap-2"
                >
                  {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{language === 'bn' ? 'টেস্ট এসএমএস পাঠান' : 'Send Test SMS'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SMS Delivery Logs & Cost Analysis Table */}
      <Card className="rounded-3xl border-slate-200/90 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>{language === 'bn' ? 'এসএমএস ডেলিভারি হিস্ট্রি ও খরচ অডিট' : 'SMS Delivery Logs & Audit'}</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                সদস্যদের প্রেরিত প্রতিটি এসএমএসের অবস্থা, সময় ও খরচ বিশ্লেষণ।
              </CardDescription>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="ফোন, নাম বা মেসেজ খুঁজুন..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-8 text-xs rounded-xl h-9 w-44 sm:w-56"
                />
              </div>

              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as any)}
                className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="all">সকল ধরন</option>
                <option value="dues_reminder">বকেয়া চাঁদা রিমাইন্ডার</option>
                <option value="notice">নোটিশ ঘোষণা</option>
                <option value="test">টেস্ট এসএমএস</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLogs()}
                className="h-9 rounded-xl border-slate-300 text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="text-xs font-bold">তারিখ ও সময়</TableHead>
                  <TableHead className="text-xs font-bold">প্রাপক</TableHead>
                  <TableHead className="text-xs font-bold">উদ্দেশ্য</TableHead>
                  <TableHead className="text-xs font-bold min-w-[200px]">মেসেজ</TableHead>
                  <TableHead className="text-xs font-bold text-center">পার্ট</TableHead>
                  <TableHead className="text-xs font-bold text-right">খরচ</TableHead>
                  <TableHead className="text-xs font-bold text-center">স্ট্যাটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 text-xs">
                      <TableCell className="font-mono text-slate-500 whitespace-nowrap">
                        {log.createdAt ? format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {log.recipientName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {log.recipientPhone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {log.purpose === 'dues_reminder' ? 'বকেয়া চাঁদা' : log.purpose === 'notice' ? 'নোটিশ' : 'টেস্ট/কাস্টম'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-slate-600 dark:text-slate-400" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {log.smsCount}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600">
                        ৳{log.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.status === 'delivered' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                            ডেলিভার্ড
                          </Badge>
                        ) : log.status === 'failed' ? (
                          <Badge variant="destructive" className="text-[10px] font-bold">
                            ব্যর্থ
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold">
                            প্রক্রিয়াধীন
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                      কোনো এসএমএস লগ রেকর্ড পাওয়া যায়নি।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmsGateway;
