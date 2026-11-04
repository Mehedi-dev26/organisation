import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Save,
  RotateCcw,
  Send,
  MessageSquare,
  Users,
  Receipt,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Smartphone,
  Eye,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Tag,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getSmsTemplatesConfig,
  saveSmsTemplatesConfig,
  calculateSmsParts,
  renderSmsTemplate,
  sendSingleSms,
  type SmsTemplateItem,
  DEFAULT_SMS_TEMPLATES
} from '@/services/smsService';

export const SmsTemplates: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<'all' | 'member' | 'dues' | 'payment'>('all');
  const [templates, setTemplates] = useState<SmsTemplateItem[]>(DEFAULT_SMS_TEMPLATES);

  // Test SMS Dialog State
  const [testModalTemplate, setTestModalTemplate] = useState<SmsTemplateItem | null>(null);
  const [testRecipientPhone, setTestRecipientPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Fetch templates from Supabase
  const { data: dbTemplates = DEFAULT_SMS_TEMPLATES, isLoading } = useQuery({
    queryKey: ['sms-templates-config'],
    queryFn: getSmsTemplatesConfig,
  });

  useEffect(() => {
    if (dbTemplates && dbTemplates.length > 0) {
      setTemplates(dbTemplates);
    }
  }, [dbTemplates]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: saveSmsTemplatesConfig,
    onSuccess: (saved) => {
      queryClient.setQueryData(['sms-templates-config'], saved);
      toast({
        title: language === 'bn' ? 'ফরম্যাট সফলভাবে সংরক্ষিত!' : 'Templates Saved Successfully!',
        description: language === 'bn' 
          ? 'সকল কাস্টম এসএমএস ফরম্যাট ও অটোমেশন সেটিংস ডাটাবেজে আপডেট হয়েছে।' 
          : 'All SMS formats updated in database.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'সংরক্ষণ ব্যর্থ',
        description: err.message || 'ডাটাবেজে ফরম্যাট সংরক্ষণ করা সম্ভব হয়নি।',
        variant: 'destructive',
      });
    },
  });

  // Handle template text update
  const handleTemplateTextChange = (id: string, newText: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, template: newText } : t))
    );
  };

  // Handle template active switch toggle
  const handleToggleActive = (id: string, active: boolean) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: active } : t))
    );
  };

  // Reset a specific template to default
  const handleResetToDefault = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, template: t.defaultTemplate } : t))
    );
    toast({
      title: 'ডিফল্ট ফরম্যাটে রিসেট হয়েছে',
      description: 'পূর্বনির্ধারিত ৭৫ অক্ষরের সাশ্রয়ী ফরম্যাট রিস্টোর করা হয়েছে।',
    });
  };

  // Insert tag into textarea
  const handleInsertTag = (templateId: string, tag: string) => {
    const item = templates.find((t) => t.id === templateId);
    if (!item) return;

    const textarea = document.getElementById(`textarea-${templateId}`) as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = item.template;
      const updated = current.substring(0, start) + tag + current.substring(end);
      handleTemplateTextChange(templateId, updated);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else {
      handleTemplateTextChange(templateId, item.template + ' ' + tag);
    }
  };

  // Send single test SMS using the current template
  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalTemplate || !testRecipientPhone.trim()) {
      toast({
        title: 'মোবাইল নম্বর দিন',
        description: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingTest(true);

    try {
      const sampleVariables = {
        name: 'মোঃ মেহেদী হাসান',
        member_id: 'SB-01',
        password: 'batighor123',
        amount: '100',
        month: 'নভেম্বর',
        trx_id: '9X45BKL2',
        reject_reason: 'ভুল ট্রানজেকশন আইডি',
        login_link: 'https://samoyerbatighor.pro.bd/login',
        payment_link: 'https://samoyerbatighor.pro.bd/pay?t=PL-2601-8K3M',
        org_name: 'সময়ের বাতিঘর',
        title: 'জরুরি সাধারণ সভা',
        content: 'আগামী শুক্রবার বিকাল ৪টায়...',
      };

      const populatedMessage = renderSmsTemplate(testModalTemplate.template, sampleVariables);

      const res = await sendSingleSms(
        testRecipientPhone.trim(),
        'টেস্ট প্রাপক',
        populatedMessage,
        'test'
      );

      if (res.success) {
        toast({
          title: 'টেস্ট এসএমএস প্রেরিত হয়েছে!',
          description: `${testRecipientPhone} নম্বরে ফরম্যাট টেস্ট পাঠানো হয়েছে।`,
        });
        setTestModalTemplate(null);
      } else {
        toast({
          title: 'এসএমএস প্রেরণ ব্যর্থ',
          description: res.message,
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

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.category === activeFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Top Header - Consistent with Organization Design System */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#14231B] dark:text-foreground flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#0B6B3A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <span>{language === 'bn' ? 'এসএমএস ফরম্যাট ও অটোমেশন টেমপ্লেট' : 'SMS Formats & Automation'}</span>
            <Badge className="bg-emerald-600 text-white border-0 text-[11px] font-bold ml-1">
              Customizer
            </Badge>
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {language === 'bn'
              ? 'সদস্য অনুমোদন, পাসওয়ার্ড, বকেয়া চাঁদা ও পেমেন্ট রসিদের স্বয়ংক্রিয় এসএমএস ফরম্যাট নিয়ন্ত্রণ করুন'
              : 'Customize and automate SMS templates for member approval, dues reminders, and payment receipts.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/sms-gateway')}
            className="border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs gap-1.5 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>{language === 'bn' ? 'এসএমএস গেটওয়ে সেটিংস' : 'Gateway Settings'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => saveMutation.mutate(templates)}
            disabled={saveMutation.isPending}
            className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-medium text-xs rounded-xl shadow-sm gap-1.5"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{language === 'bn' ? 'সকল ফরম্যাট সংরক্ষণ করুন' : 'Save All Formats'}</span>
          </Button>
        </div>
      </div>

      {/* 4 Interactive Category Filter Buttons matching user request */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Button 1: Member Welcome */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'member' ? 'all' : 'member')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeFilter === 'member'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50/50'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">সদস্য আবেদন</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">অনুমোদন ও স্বাগতম</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">পাসওয়ার্ড ও লগইন লিংক সহ</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0B6B3A] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </button>

        {/* Button 2: Dues Reminder */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'dues' ? 'all' : 'dues')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeFilter === 'dues'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/50'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">মাসিক চাঁদা</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">বকেয়া চাঁদা রিমাইন্ডার</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">স্বয়ংক্রিয় বা বাল্ক তাগাদা</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </button>

        {/* Button 3: Payment Approved */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'payment' ? 'all' : 'payment')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeFilter === 'payment'
              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 shadow-sm ring-1 ring-teal-500'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 hover:border-teal-300 hover:bg-slate-50/50'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">পেমেন্ট ভেরিফিকেশন</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">অনুমোদন ও প্রাপ্তিস্বীকার</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">TrxID ও পরিমাণ সহ নিশ্চিতকরণ</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>

        {/* Button 4: Payment Rejected */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'payment' ? 'all' : 'payment')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeFilter === 'payment'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-sm ring-1 ring-rose-500'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 hover:border-rose-300 hover:bg-slate-50/50'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">পেমেন্ট বাতিল</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">প্রত্যাখ্যান ও কারণ</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">কারণ উল্লেখ করে মেসেজ</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* 70-character cost saver advisory banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/60 flex items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
              💡 ৭৫ অক্ষরের ভেতরে রাখলে ১ পার্ট এসএমএস = মাত্র ৩৫ পয়সা খরচ হবে!
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
              প্রতিটি টেমপ্লেট এমনভাবে সাজানো হয়েছে যেন ১ পার্টের মধ্যে থাকে। আপনি পরিবর্তন করার সময় লাইভ কাউন্টার দেখে বাজেট নিয়ন্ত্রণ করতে পারবেন।
            </p>
          </div>
        </div>

        {activeFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="text-xs font-bold text-emerald-700 shrink-0"
          >
            সব দেখুন ({templates.length})
          </Button>
        )}
      </div>

      {/* Templates Editor Cards */}
      <div className="space-y-6">
        {filteredTemplates.map((item) => {
          const partsInfo = calculateSmsParts(item.template);
          const isSinglePart = partsInfo.parts === 1;

          // Sample preview data for live simulation
          const sampleData = {
            name: 'মোঃ মেহেদী হাসান',
            member_id: 'SB-01',
            password: 'batighor123',
            amount: '১০০',
            month: 'নভেম্বর',
            trx_id: '9X45BKL2',
            reject_reason: 'ভুল TrxID',
            login_link: 'https://samoyerbatighor.pro.bd/login',
            payment_link: 'https://samoyerbatighor.pro.bd/pay?t=PL-2601-8K3M',
            org_name: 'সময়ের বাতিঘর',
            title: 'জরুরি নোটিশ',
            content: 'আগামী শুক্রবার সাধারণ সভা অনুষ্ঠিত হবে...',
          };

          const simulatedPreview = renderSmsTemplate(item.template, sampleData);

          return (
            <Card
              key={item.id}
              className={`rounded-3xl border shadow-sm transition-all overflow-hidden bg-white dark:bg-slate-900 ${
                item.isActive ? 'border-slate-200/90' : 'border-slate-200/60 opacity-80 bg-slate-50/40'
              }`}
            >
              <CardHeader className="bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0B6B3A] flex items-center justify-center font-bold text-sm shrink-0">
                      {item.category === 'member' ? (
                        <Users className="w-5 h-5" />
                      ) : item.category === 'dues' ? (
                        <Receipt className="w-5 h-5" />
                      ) : item.category === 'payment' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <MessageSquare className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          {item.nameBn}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            item.category === 'member'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.category === 'dues'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {item.nameEn}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {item.isActive ? 'স্বয়ংক্রিয় প্রেরণ সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={(val) => handleToggleActive(item.id, val)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-5">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left Column: Template Editor (7 cols) */}
                  <div className="lg:col-span-7 space-y-3">
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>এসএমএস বার্তা ফরম্যাট (কাস্টমাইজ করুন):</span>
                      </Label>

                      {/* Character & Part Counter Badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {partsInfo.chars} অক্ষর
                        </span>
                        <Badge
                          className={`text-[10px] font-bold border ${
                            isSinglePart
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isSinglePart ? '১ পার্ট (৳০.৩৫)' : `${partsInfo.parts} পার্ট (৳${(partsInfo.parts * 0.35).toFixed(2)})`}
                        </Badge>
                      </div>
                    </div>

                    <Textarea
                      id={`textarea-${item.id}`}
                      rows={4}
                      value={item.template}
                      onChange={(e) => handleTemplateTextChange(item.id, e.target.value)}
                      className="text-xs font-sans rounded-2xl leading-relaxed resize-y border-slate-300 focus:border-[#0B6B3A] shadow-2xs"
                      placeholder="এখানে এসএমএস ফরম্যাট লিখুন..."
                    />

                    {/* Available Dynamic Tags Pills */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <span>ক্লিক করে ভ্যারিয়েবল যোগ করুন:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.availableTags.map((t) => (
                          <button
                            key={t.tag}
                            type="button"
                            onClick={() => handleInsertTag(item.id, t.tag)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 text-slate-700 text-[11px] font-mono font-bold transition-all cursor-pointer"
                            title={`নমুনা মান: ${t.sample}`}
                          >
                            <span>{t.tag}</span>
                            <span className="text-[10px] text-slate-400 font-sans font-normal">({t.label})</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetToDefault(item.id)}
                        className="rounded-xl text-xs font-bold gap-1 text-slate-600 hover:text-slate-900"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ডিফল্ট ফরম্যাটে রিসেট</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveMutation.mutate(templates)}
                        disabled={saveMutation.isPending}
                        className="bg-[#0B6B3A] hover:bg-[#09542e] text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                      >
                        {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>সংরক্ষণ</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setTestModalTemplate(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>টেস্ট পাঠান</span>
                      </Button>
                    </div>

                  </div>

                  {/* Right Column: Live Recipient Smartphone Preview (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>প্রাপকের ফোনে যেভাবে দৃশ্যমান হবে (লাইভ প্রিভিউ):</span>
                    </Label>

                    {/* Authentic Phone Bubble */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-300/80 dark:border-slate-700 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Sender Header */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-300/60 pb-1.5">
                          <span className="font-bold flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-emerald-600" />
                            <span>Bulk SMS • SomoyerBatighor</span>
                          </span>
                          <span>আজ, ১২:৩০ PM</span>
                        </div>

                        {/* Speech Bubble */}
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/90 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                          {simulatedPreview}
                        </div>
                      </div>

                      {/* Footer Info inside Phone */}
                      <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>সিমুলেশন ডেটা সহ</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {partsInfo.chars} অক্ষর • {partsInfo.parts} পার্ট
                        </span>
                      </div>
                    </div>

                  </div>

                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instant Test SMS Dialog */}
      <Dialog open={!!testModalTemplate} onOpenChange={() => setTestModalTemplate(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#14231B] dark:text-white">
              <Send className="w-5 h-5 text-emerald-600" />
              <span>টেস্ট মেসেজ প্রেরণ</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              "{testModalTemplate?.nameBn}" ফরম্যাটটি আপনার ফোনে টেস্ট মেসেজ পাঠিয়ে দেখে নিন।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendTestSms} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                আপনার মোবাইল নম্বর *
              </Label>
              <Input
                type="tel"
                value={testRecipientPhone}
                onChange={(e) => setTestRecipientPhone(e.target.value)}
                placeholder="যেমন: 017XXXXXXXX"
                className="font-mono text-xs rounded-xl"
                autoFocus
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-bold text-[11px] text-emerald-700 block">প্রেরণযোগ্য বার্তা:</span>
              <p className="font-sans leading-relaxed text-[11px] line-clamp-3">
                {testModalTemplate ? renderSmsTemplate(testModalTemplate.template, {
                  name: 'মেহেদী হাসান',
                  member_id: 'SB-01',
                  password: 'batighor123',
                  amount: '১০০',
                  month: 'নভেম্বর',
                  trx_id: '9X45BKL2',
                  reject_reason: 'ভুল TrxID',
                  login_link: 'https://samoyerbatighor.pro.bd/login',
                  payment_link: 'https://samoyerbatighor.pro.bd/pay?t=PL-2601-8K3M',
                  org_name: 'সময়ের বাতিঘর',
                }) : ''}
              </p>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTestModalTemplate(null)}
                disabled={isSendingTest}
                className="rounded-xl text-xs font-bold"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={isSendingTest}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>পাঠান</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SmsTemplates;

