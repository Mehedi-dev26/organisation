import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Save, 
  Sparkles, 
  Check, 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  RefreshCw,
  Copy,
  AlertCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { generateLocalPaymentInstruction, type PaymentMethod, type AccountType } from '@/lib/ai-payment';

interface PaymentMethodRecord {
  id: string;
  method_type: string;
  account_name: string;
  account_number: string;
  branch_name: string | null;
  routing_number: string | null;
  instructions_bn: string | null;
  instructions_en: string | null;
  is_active: boolean | null;
  sort_order: number | null;
}

const BRAND_THEMES: Record<string, {
  label: string;
  labelEn: string;
  headerColor: string;
  border: string;
  accent: string;
  badgeBg: string;
  iconBg: string;
}> = {
  bkash: {
    label: 'বিকাশ (bKash)',
    labelEn: 'bKash Gateway',
    headerColor: 'bg-gradient-to-r from-pink-600 to-rose-600',
    border: 'border-pink-200 dark:border-pink-900',
    accent: 'text-pink-600',
    badgeBg: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300',
    iconBg: 'bg-pink-500',
  },
  nagad: {
    label: 'নগদ (Nagad)',
    labelEn: 'Nagad Gateway',
    headerColor: 'bg-gradient-to-r from-orange-500 to-red-600',
    border: 'border-orange-200 dark:border-orange-900',
    accent: 'text-orange-600',
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
    iconBg: 'bg-orange-500',
  },
  rocket: {
    label: 'রকেট (Rocket)',
    labelEn: 'Rocket Gateway',
    headerColor: 'bg-gradient-to-r from-purple-600 to-fuchsia-700',
    border: 'border-purple-200 dark:border-purple-900',
    accent: 'text-purple-600',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    iconBg: 'bg-purple-600',
  },
  bank: {
    label: 'ব্যাংক একাউন্ট',
    labelEn: 'Bank Transfer',
    headerColor: 'bg-gradient-to-r from-slate-700 to-blue-800',
    border: 'border-blue-200 dark:border-blue-900',
    accent: 'text-blue-600',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    iconBg: 'bg-blue-600',
  },
};

export const PaymentGateways = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [savingMethod, setSavingMethod] = useState<string | null>(null);

  // Form states per method
  const [formState, setFormState] = useState<Record<string, {
    account_number: string;
    account_name: string;
    account_type: AccountType;
    instructions_bn: string;
    is_active: boolean;
    branch_name: string;
    routing_number: string;
  }>>({});

  // Query payment methods
  const { data: methods, isLoading, refetch } = useQuery({
    queryKey: ['admin-payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as PaymentMethodRecord[];
    },
  });

  // Populate local form state when data loads
  useEffect(() => {
    if (methods && methods.length > 0) {
      const next: typeof formState = {};
      methods.forEach((m) => {
        let detectedType: AccountType = 'personal';
        if (m.instructions_bn?.toLowerCase().includes('merchant') || m.instructions_bn?.includes('মার্চেন্ট') || m.instructions_bn?.includes('Payment')) {
          detectedType = 'merchant';
        }

        next[m.method_type] = {
          account_number: m.account_number || '',
          account_name: m.account_name || 'সময়ের বাতিঘর',
          account_type: detectedType,
          instructions_bn: m.instructions_bn || '',
          is_active: m.is_active ?? true,
          branch_name: m.branch_name || '',
          routing_number: m.routing_number || '',
        };
      });
      setFormState(next);
    }
  }, [methods]);

  const updateField = (
    methodType: string,
    field: string,
    value: any
  ) => {
    setFormState((prev) => ({
      ...prev,
      [methodType]: {
        ...(prev[methodType] || {
          account_number: '',
          account_name: 'সময়ের বাতিঘর',
          account_type: 'personal',
          instructions_bn: '',
          is_active: true,
          branch_name: '',
          routing_number: '',
        }),
        [field]: value,
      },
    }));
  };

  const handleGenerateAIInstructions = (methodType: string) => {
    const cur = formState[methodType];
    if (!cur?.account_number?.trim() || cur.account_number === '01XXXXXXXXX') {
      toast({
        title: language === 'bn' ? 'নম্বর লিখুন' : 'Enter Number',
        description: language === 'bn' ? 'প্রথমে সঠিক মোবাইল/অ্যাকাউন্ট নম্বরটি লিখুন' : 'Please provide the account number first',
        variant: 'destructive',
      });
      return;
    }

    const generated = generateLocalPaymentInstruction(
      methodType as PaymentMethod,
      cur.account_type || 'personal',
      cur.account_number,
      'SB-001'
    );

    updateField(methodType, 'instructions_bn', generated);
    toast({
      title: language === 'bn' ? 'AI নির্দেশনা তৈরি!' : 'AI Generated!',
      description: language === 'bn' ? `${BRAND_THEMES[methodType]?.label || methodType} এর জন্য প্রফেশনাল পেমেন্ট নির্দেশিকা তৈরি হয়েছে।` : 'Payment instructions generated.',
    });
  };

  const handleSaveMethod = async (methodType: string) => {
    const record = methods?.find((m) => m.method_type === methodType);
    const data = formState[methodType];
    if (!data) return;

    if (!data.account_number.trim()) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'অ্যাকাউন্ট বা মোবাইল নম্বর প্রদান করুন' : 'Please provide account number',
        variant: 'destructive',
      });
      return;
    }

    setSavingMethod(methodType);
    try {
      if (record) {
        // Update existing record
        const { error } = await supabase
          .from('payment_methods')
          .update({
            account_number: data.account_number.trim(),
            account_name: data.account_name.trim(),
            instructions_bn: data.instructions_bn.trim(),
            is_active: data.is_active,
            branch_name: data.branch_name?.trim() || null,
            routing_number: data.routing_number?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('payment_methods')
          .insert({
            method_type: methodType,
            account_number: data.account_number.trim(),
            account_name: data.account_name.trim(),
            instructions_bn: data.instructions_bn.trim(),
            is_active: data.is_active,
            branch_name: data.branch_name?.trim() || null,
            routing_number: data.routing_number?.trim() || null,
            sort_order: methodType === 'bkash' ? 1 : methodType === 'nagad' ? 2 : methodType === 'rocket' ? 3 : 4,
          });

        if (error) throw error;
      }

      // Invalidate queries so member dues & checkout immediately see the live number
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      refetch();

      toast({
        title: language === 'bn' ? 'সফল!' : 'Saved!',
        description: language === 'bn' 
          ? `${BRAND_THEMES[methodType]?.label || methodType} নম্বর ও গেটওয়ে সফলভাবে সংরক্ষিত হয়েছে।`
          : 'Payment gateway configuration updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: language === 'bn' ? 'সংরক্ষণ ব্যর্থ' : 'Save Failed',
        description: err.message || 'Error saving gateway',
        variant: 'destructive',
      });
    } finally {
      setSavingMethod(null);
    }
  };

  const defaultKeys = ['bkash', 'nagad', 'rocket', 'bank'];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-emerald-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'bn' ? 'সরাসরি গেটওয়ে নিয়ন্ত্রণ' : 'Live Gateway Controller'}</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#0B6B3A]" />
            {language === 'bn' ? 'পেমেন্ট গেটওয়ে কন্ট্রোল ও সেটিংস' : 'Payment Gateway Settings'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {language === 'bn'
              ? 'বিকাশ, নগদ, রকেট ও ব্যাংক একাউন্ট নম্বর পরিবর্তন করুন। এখানে নম্বর পরিবর্তন করলে সদস্য প্যানেলের চাঁদা পরিশোধ পেজে তাৎক্ষণিকভাবে লাইভ আপডেট হবে।'
              : 'Configure dynamic bKash, Nagad, Rocket and Bank account numbers. Updates propagate instantly to the member portal.'}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
        </Button>
      </div>

      {/* Real-time Notice banner */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
          {language === 'bn'
            ? 'সদস্যরা যেন কোন প্রকার এজ ফাংশন এরর ছাড়াই সরাসরি বিকাশ, নগদ বা রকেটে চাঁদা পাঠিয়ে ট্রানজেকশন আইডি (TrxID) দিয়ে সাবমিট করতে পারে, তার জন্য আপনার আসল সচল পার্সোনাল বা মার্চেন্ট নম্বর এখানে সেভ করে রাখুন।'
            : 'Enter active bKash, Nagad, and Rocket numbers here so members can send dues and submit TrxID smoothly without any edge function failures.'}
        </p>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {defaultKeys.map((methodKey) => {
          const theme = BRAND_THEMES[methodKey] || BRAND_THEMES.bkash;
          const current = formState[methodKey] || {
            account_number: '',
            account_name: 'সময়ের বাতিঘর',
            account_type: 'personal',
            instructions_bn: '',
            is_active: true,
            branch_name: '',
            routing_number: '',
          };

          const isSaving = savingMethod === methodKey;

          return (
            <Card 
              key={methodKey} 
              className={`rounded-3xl overflow-hidden border-2 ${theme.border} shadow-md bg-white dark:bg-slate-900 transition-all hover:shadow-lg`}
            >
              {/* Header */}
              <div className={`p-4 sm:p-5 text-white flex items-center justify-between ${theme.headerColor}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    {methodKey === 'bank' ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg leading-tight">
                      {language === 'bn' ? theme.label : theme.labelEn}
                    </h3>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      {current.is_active ? (language === 'bn' ? 'সক্রিয় গেটওয়ে' : 'Active Gateway') : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </p>
                  </div>
                </div>

                {/* Active Switch */}
                <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Switch
                    checked={current.is_active}
                    onCheckedChange={(val) => updateField(methodKey, 'is_active', val)}
                    className="data-[state=checked]:bg-emerald-400"
                  />
                  <span className="text-xs font-bold text-white">
                    {current.is_active ? (language === 'bn' ? 'চালু' : 'ON') : (language === 'bn' ? 'বন্ধ' : 'OFF')}
                  </span>
                </div>
              </div>

              {/* Body */}
              <CardContent className="p-5 sm:p-6 space-y-4">
                {/* Account Number */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {methodKey === 'bank' 
                      ? (language === 'bn' ? 'ব্যাংক হিসাব নম্বর' : 'Account Number')
                      : (language === 'bn' ? `${theme.label} মোবাইল নম্বর (টাকা পাঠানোর জন্য)` : 'Mobile Number')}
                  </Label>
                  <Input
                    type="text"
                    value={current.account_number}
                    onChange={(e) => updateField(methodKey, 'account_number', e.target.value)}
                    placeholder={methodKey === 'bank' ? 'যেমন: 123456789012' : 'যেমন: 01712345678'}
                    className="font-mono text-base font-bold rounded-xl h-11 border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:ring-emerald-600"
                  />
                </div>

                {/* Account Holder Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'হিসাবধারীর নাম' : 'Account Name'}
                    </Label>
                    <Input
                      type="text"
                      value={current.account_name}
                      onChange={(e) => updateField(methodKey, 'account_name', e.target.value)}
                      placeholder="সময়ের বাতিঘর"
                      className="text-xs sm:text-sm rounded-xl h-10 border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  {methodKey !== 'bank' ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'অ্যাকাউন্টের ধরন' : 'Account Type'}
                      </Label>
                      <select
                        value={current.account_type || 'personal'}
                        onChange={(e) => updateField(methodKey, 'account_type', e.target.value as AccountType)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 h-10 px-3 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="personal">Personal (Send Money)</option>
                        <option value="merchant">Merchant (Payment)</option>
                        <option value="payment">Payment / বিল পে</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'শাখা ও রাউটিং' : 'Branch / Routing'}
                      </Label>
                      <Input
                        type="text"
                        value={current.branch_name}
                        onChange={(e) => updateField(methodKey, 'branch_name', e.target.value)}
                        placeholder="নওগাঁ শাখা"
                        className="text-xs rounded-xl h-10 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  )}
                </div>

                {/* Instructions with AI Generator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'ইউজারের জন্য নির্দেশনা (বাংলা)' : 'Instructions (Bengali)'}
                    </Label>
                    <button
                      type="button"
                      onClick={() => handleGenerateAIInstructions(methodKey)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200"
                    >
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>{language === 'bn' ? 'AI নির্দেশিকা তৈরি' : 'AI Generate'}</span>
                    </button>
                  </div>
                  <Textarea
                    rows={4}
                    value={current.instructions_bn}
                    onChange={(e) => updateField(methodKey, 'instructions_bn', e.target.value)}
                    placeholder="ইউজারকে কীভাবে টাকা পাঠাতে হবে তার ধাপগুলো লিখুন..."
                    className="text-xs rounded-xl leading-relaxed border-slate-300 dark:border-slate-700 focus:border-emerald-600"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={() => handleSaveMethod(methodKey)}
                  disabled={isSaving}
                  className="w-full bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold h-11 rounded-xl shadow-md gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                      : (language === 'bn' ? `${theme.label} সংরক্ষণ করুন` : `Save ${theme.labelEn}`)}
                  </span>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentGateways;

