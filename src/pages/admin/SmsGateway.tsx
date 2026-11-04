import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Activity,
  AlertTriangle,
  Info
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showApiKey, setShowApiKey] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [gatewayBalance, setGatewayBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Test SMS State
  const [testPhone, setTestPhone] = useState('');
  const [testName, setTestName] = useState('');
  const [testMessage, setTestMessage] = useState('সময়ের বাতিঘর টেস্ট এসএমএস। গেটওয়ে সফলভাবে কানেক্টেড রয়েছে।');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
      // Auto check balance if API key is present
      if (settings.apiKey && settings.apiKey.trim()) {
        checkGatewayBalance(settings).then((res) => {
          if (res.success) {
            setGatewayBalance(res.balance);
            setBalanceError(null);
          } else if (res.error) {
            setBalanceError(res.error);
          }
        }).catch(() => {});
      }
    }
  }, [settings]);

  // Query Logs
  const { data: logs = [], isLoading: isLogsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['sms-delivery-logs'],
    queryFn: getSmsDeliveryLogs,
    refetchInterval: 15000,
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
    onSuccess: (saved) => {
      queryClient.setQueryData(['sms-gateway-settings'], saved);
      toast({
        title: language === 'bn' ? 'সেটিংস সংরক্ষিত হয়েছে!' : 'Settings Saved!',
        description: language === 'bn' 
          ? 'এসএমএস গেটওয়ে কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।' 
          : 'SMS Gateway settings updated successfully.',
      });
      // Re-check balance with saved settings
      handleCheckBalance();
    },
    onError: (err: any) => {
      toast({
        title: language === 'bn' ? 'সংরক্ষণ ব্যর্থ' : 'Save Failed',
        description: err.message || 'ডাটাবেজে সেটিংস সংরক্ষণ করা সম্ভব হয়নি।',
        variant: 'destructive',
      });
    },
  });

  // Check Balance
  const handleCheckBalance = async () => {
    setIsCheckingBalance(true);
    setBalanceError(null);
    try {
      const res = await checkGatewayBalance(formSettings);
      if (res.success) {
        setGatewayBalance(res.balance);
        toast({
          title: language === 'bn' ? 'ব্যালেন্স আপডেট' : 'Balance Updated',
          description: language === 'bn' 
            ? `বর্তমান রিচার্জ ব্যালেন্স: ৳${res.balance.toFixed(2)}`
            : `Current balance: BDT ${res.balance.toFixed(2)}`,
        });
      } else {
        setBalanceError(res.error || 'ব্যালেন্স দেখতে ব্যর্থ');
        toast({
          title: 'ব্যালেন্স দেখতে ব্যর্থ',
          description: res.error || 'API Key সঠিক কিনা যাচাই করুন।',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setBalanceError(err.message);
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

    if (!formSettings.senderId || !formSettings.senderId.trim()) {
      toast({
        title: 'Sender ID অনুপস্থিত',
        description: 'দয়া করে আগে আপনার Bulk SMS BD প্যানেলের অনুমোদিত Sender ID দিন এবং সংরক্ষণ করুন।',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingTest(true);
    setLastTestResult(null);

    try {
      const res = await sendSingleSms(
        testPhone.trim(),
        testName.trim() || 'টেস্ট প্রাপক',
        testMessage.trim(),
        'test'
      );

      setLastTestResult({ success: res.success, message: res.message });

      if (res.success) {
        toast({
          title: language === 'bn' ? 'টেস্ট এসএমএস সফলভাবে প্রেরিত!' : 'Test SMS Sent Successfully!',
          description: language === 'bn' 
            ? `${testPhone} নম্বরে এসএমএস চলে গেছে। ডেলিভারি লগ দেখুন।`
            : `SMS delivered to ${testPhone}. Log recorded.`,
        });
        refetchLogs();
        handleCheckBalance();
      } else {
        toast({
          title: 'এসএমএস প্রেরণ ব্যর্থ হয়েছে',
          description: res.message,
          variant: 'destructive',
        });
        refetchLogs();
      }
    } catch (err: any) {
      setLastTestResult({ success: false, message: err.message });
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Top Header - Consistent with Finance & Members Management */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#14231B] dark:text-foreground flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#0B6B3A]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span>{language === 'bn' ? 'এসএমএস গেটওয়ে ও অটোমেশন' : 'SMS Gateway & Automation'}</span>
            <div className="inline-flex items-center gap-1.5 ml-1">
              <Badge className="bg-emerald-600 text-white border-0 text-[11px] font-bold">
                Bulk SMS BD
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigate('/admin/sms-templates')}
                className="h-7 px-2.5 rounded-lg border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 text-[#0B6B3A] text-xs font-bold gap-1 shadow-2xs transition-all hover:scale-105"
                title="এসএমএস ফরম্যাট ও টেমপ্লেট পেজে যান"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'bn' ? 'এসএমএস ফরম্যাট / টেমপ্লেট' : 'SMS Formats'}</span>
              </Button>
            </div>
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {language === 'bn' 
              ? 'সদস্যদের নোটিশ ঘোষণা, বকেয়া চাঁদা রিমাইন্ডার এবং তাৎক্ষণিক বাল্ক এসএমএস ব্রডকাস্ট নিয়ন্ত্রণ করুন' 
              : 'Broadcast notices, automated dues payment reminders, and live gateway cost analysis.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCheckBalance}
            disabled={isCheckingBalance}
            className="border-emerald-200 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300 font-bold text-xs gap-1.5 shadow-2xs"
          >
            {isCheckingBalance ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>
              {gatewayBalance !== null 
                ? `ব্যালেন্স: ৳${gatewayBalance.toFixed(2)}` 
                : (language === 'bn' ? 'ব্যালেন্স রিফ্রেশ' : 'Check Balance')}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/sms-templates')}
            className="border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'bn' ? 'এসএমএস ফরম্যাট / টেমপ্লেট' : 'SMS Formats'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => saveMutation.mutate(formSettings)}
            disabled={saveMutation.isPending}
            className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-medium text-xs rounded-xl shadow-sm gap-1.5"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{language === 'bn' ? 'কনফিগারেশন সংরক্ষণ' : 'Save Settings'}</span>
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

        {/* Current Balance */}
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{language === 'bn' ? 'গেটওয়ে লাইভ ব্যালেন্স' : 'Gateway Balance'}</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {gatewayBalance !== null ? `৳${gatewayBalance.toFixed(2)}` : '৳০.০০'}
              </h3>
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
          <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>{language === 'bn' ? 'বাল্ক এসএমএস বিডি (Bulk SMS BD) গেটওয়ে কনফিগারেশন' : 'Gateway Configuration'}</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {language === 'bn' ? 'আপনার বাল্ক এসএমএস বিডি অ্যাকাউন্ট থেকে API Key ও অনুমোদিত Sender ID দিন।' : 'Enter your Bulk SMS BD credentials.'}
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
              
              {/* Important Sender ID Advisory Alert Box */}
              <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 space-y-1.5 text-xs leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>জরুরি নির্দেশনা: Sender ID সঠিকভাবে পূরণ করুন</span>
                </div>
                <p>
                  Bulk SMS BD-তে আপনার একাউন্টের জন্য অনুমোদিত প্রেরক আইডি (Sender ID) প্রদান করা বাধ্যতামূলক। 
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300 pl-1">
                  <li><strong>মাস্কিং অ্যাকাউন্ট:</strong> আপনার অনুমোদিত ব্র্যান্ড নাম (যেমন: <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">Batighor</code>) দিন।</li>
                  <li><strong>নন-মাস্কিং অ্যাকাউন্ট:</strong> Bulk SMS BD ড্যাশবোর্ডে লগইন করে বাম পাশের <strong>"Sender ID"</strong> মেনুতে যান। সেখানে আপনার একাউন্টের জন্য বরাদ্দকৃত ১১ বা ১৩ ডিজিটের নম্বরটি (যেমন <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">88096...</code>) হুবহু কপি করে এখানে পেস্ট করুন।</li>
                </ul>
              </div>

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
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>সেন্ডার আইডি / প্রেরক নম্বর (Sender ID) *</span>
                  </Label>
                  <Input
                    value={formSettings.senderId}
                    onChange={(e) => setFormSettings((prev) => ({ ...prev, senderId: e.target.value }))}
                    placeholder="প্যানেল থেকে প্রাপ্ত Sender ID বা নম্বর দিন"
                    className="text-xs font-bold rounded-xl border-amber-300/80 focus:border-[#0B6B3A]"
                    required
                  />
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    API Key (গোপন এপিআই কী) *
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
                  required
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
                    className="font-mono text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    কম ব্যালেন্স সতর্কবার্তা থ্রেশহোল্ড (BDT)
                  </Label>
                  <Input
                    type="number"
                    value={formSettings.lowBalanceAlertThreshold}
                    onChange={(e) => setFormSettings((prev) => ({ ...prev, lowBalanceAlertThreshold: parseFloat(e.target.value) || 50 }))}
                    className="font-mono text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <Button
                  onClick={() => saveMutation.mutate(formSettings)}
                  disabled={saveMutation.isPending}
                  className="w-full bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl shadow-md py-2.5 gap-2"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>কনফিগারেশন সংরক্ষণ করুন</span>
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Instant Live SMS Tester (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 p-5">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>তাৎক্ষণিক টেস্ট এসএমএস পাঠান</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                যেকোনো সচল নম্বরে টেস্ট মেসেজ পাঠিয়ে রিয়েল-টাইম গেটওয়ে ও ডেলিভারি নিশ্চিত করুন।
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <form onSubmit={handleSendTestSms} className="space-y-3.5">
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    প্রাপকের মোবাইল নম্বর *
                  </Label>
                  <Input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX বা 88017XXXXXXXX"
                    className="font-mono text-xs rounded-xl"
                    required
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
                    placeholder="যেমন: মোঃ মেহেদী হাসান"
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      মেসেজের বিষয়বস্তু *
                    </Label>
                    <span className="text-[11px] font-bold text-emerald-700">
                      {testSmsParts.chars} অক্ষর ({testSmsParts.parts} পার্ট)
                    </span>
                  </div>
                  <Textarea
                    rows={4}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="text-xs rounded-xl font-sans leading-relaxed"
                    required
                  />
                </div>

                {/* Live Cost estimation */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">প্রাক্কলিত খরচ:</span>
                  <span className="font-bold text-[#0B6B3A]">
                    ৳{(testSmsParts.parts * formSettings.costPerSms).toFixed(2)} BDT
                  </span>
                </div>

                {/* Live Feedback Result */}
                {lastTestResult && (
                  <div className={`p-3 rounded-xl text-xs space-y-1 border ${
                    lastTestResult.success 
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      {lastTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>{lastTestResult.success ? 'সফল ডেলিভারি:' : 'ডেলিভারি ব্যর্থ:'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed pl-5">
                      {lastTestResult.message}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSendingTest}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl py-2.5 shadow-md gap-2"
                >
                  {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>টেস্ট এসএমএস পাঠান</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Delivery Logs Table */}
      <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>এসএমএস ডেলিভারি ও খরচ হিস্ট্রি (Delivery Logs)</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                সরাসরি গেটওয়ে থেকে প্রাপ্ত ডেলিভারি ফলাফল, রেসপন্স মেসেজ ও খরচ অডিট।
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="নম্বর বা নাম খুঁজুন..."
                  className="pl-8 text-xs rounded-xl h-9 w-44 sm:w-56"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLogs()}
                className="h-9 px-2.5 rounded-xl border-slate-200"
                title="লগ রিফ্রেশ"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px]">
                    <TableHead className="font-bold">তারিখ ও সময়</TableHead>
                    <TableHead className="font-bold">প্রাপক</TableHead>
                    <TableHead className="font-bold">উদ্দেশ্য</TableHead>
                    <TableHead className="font-bold">মেসেজ প্রিভিউ</TableHead>
                    <TableHead className="font-bold text-center">পার্ট / খরচ</TableHead>
                    <TableHead className="font-bold text-center">স্ট্যাটাস</TableHead>
                    <TableHead className="font-bold">গেটওয়ে রেসপন্স</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="text-xs hover:bg-slate-50/50">
                      <TableCell className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.createdAt ? format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{log.recipientName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{log.recipientPhone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {log.purpose === 'dues_reminder' ? '💰 চাঁদা রিমাইন্ডার' : log.purpose === 'notice' ? '📢 নোটিশ' : '🧪 টেস্ট'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-300" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell className="text-center font-mono text-[11px]">
                        <div>{log.smsCount} পার্ট</div>
                        <div className="text-emerald-700 font-bold">৳{log.cost.toFixed(2)}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {log.status === 'delivered' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            সফল
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            ব্যর্থ
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[10px] text-slate-500 max-w-[200px] truncate" title={log.responseMessage}>
                        {log.responseMessage || 'সফলভাবে সম্পন্ন'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold">কোনো এসএমএস লগ রেকর্ড পাওয়া যায়নি</p>
              <p className="text-xs">টেস্ট এসএমএস পাঠালে অথবা নোটিশ ব্রডকাস্ট করলে স্বয়ংক্রিয়ভাবে এখানে লগ যুক্ত হবে।</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default SmsGateway;
