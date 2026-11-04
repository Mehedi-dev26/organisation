import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Upload,
  Image as ImageIcon,
  Trash2,
  Info,
  ExternalLink,
  Loader2,
  Crop
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { generateLocalPaymentInstruction, type PaymentMethod, type AccountType } from '@/lib/ai-payment';
import {
  BkashLogo,
  NagadLogo,
  RocketLogo,
  UpayLogo,
  CellfinLogo,
  TapLogo
} from '@/components/payment/PaymentLogos';
import { usePaymentGatewayLogos, type PaymentGatewayLogos, SETTINGS_KEY_PAYMENT_LOGOS } from '@/hooks/usePaymentGatewayLogos';
import { LogoCropModal } from '@/components/common/LogoCropModal';

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
  defaultLogoComponent: React.ReactNode;
}> = {
  bkash: {
    label: 'বিকাশ (bKash)',
    labelEn: 'bKash Gateway',
    headerColor: 'bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700',
    border: 'border-pink-200 dark:border-pink-900',
    accent: 'text-pink-600',
    defaultLogoComponent: <BkashLogo className="w-9 h-9" />,
  },
  nagad: {
    label: 'নগদ (Nagad)',
    labelEn: 'Nagad Gateway',
    headerColor: 'bg-gradient-to-r from-orange-500 via-red-500 to-amber-600',
    border: 'border-orange-200 dark:border-orange-900',
    accent: 'text-orange-600',
    defaultLogoComponent: <NagadLogo className="w-9 h-9" />,
  },
  rocket: {
    label: 'রকেট (Rocket)',
    labelEn: 'Rocket Gateway',
    headerColor: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-700',
    border: 'border-purple-200 dark:border-purple-900',
    accent: 'text-purple-600',
    defaultLogoComponent: <RocketLogo className="w-9 h-9" />,
  },
  upay: {
    label: 'উপায় (Upay)',
    labelEn: 'Upay Gateway',
    headerColor: 'bg-gradient-to-r from-[#002D62] via-blue-700 to-sky-700',
    border: 'border-blue-200 dark:border-blue-900',
    accent: 'text-blue-600',
    defaultLogoComponent: <UpayLogo className="w-9 h-9" />,
  },
  cellfin: {
    label: 'সেলফিন (Cellfin)',
    labelEn: 'Cellfin Gateway',
    headerColor: 'bg-gradient-to-r from-[#00843D] via-emerald-600 to-teal-700',
    border: 'border-emerald-200 dark:border-emerald-900',
    accent: 'text-emerald-600',
    defaultLogoComponent: <CellfinLogo className="w-9 h-9" />,
  },
  tap: {
    label: 'ট্যাপ (Tap)',
    labelEn: 'Tap Gateway',
    headerColor: 'bg-gradient-to-r from-[#E31E24] via-rose-600 to-red-700',
    border: 'border-red-200 dark:border-red-900',
    accent: 'text-red-600',
    defaultLogoComponent: <TapLogo className="w-9 h-9" />,
  },
  bank: {
    label: 'ব্যাংক হিসাব (Bank Transfer)',
    labelEn: 'Bank Transfer',
    headerColor: 'bg-gradient-to-r from-slate-700 via-blue-900 to-slate-800',
    border: 'border-slate-300 dark:border-slate-800',
    accent: 'text-blue-600',
    defaultLogoComponent: <Building2 className="w-8 h-8 text-white" />,
  },
};

const ALL_METHOD_KEYS = ['bkash', 'nagad', 'rocket', 'upay', 'cellfin', 'tap', 'bank'];

export const PaymentGateways = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { logos, saveLogos, refetch: refetchLogos } = usePaymentGatewayLogos();

  const [savingMethod, setSavingMethod] = useState<string | null>(null);

  // Logo Crop & Adjust Modal States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [activeCropMethod, setActiveCropMethod] = useState<string | null>(null);
  const [isSavingCropped, setIsSavingCropped] = useState(false);

  // Form states per method
  const [formState, setFormState] = useState<Record<string, {
    account_number: string;
    account_name: string;
    account_type: AccountType;
    instructions_bn: string;
    is_active: boolean;
    branch_name: string;
    routing_number: string;
    logo_url: string;
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

  // Populate local form state when data and logos load
  useEffect(() => {
    const next: typeof formState = {};

    ALL_METHOD_KEYS.forEach((methodKey) => {
      const m = methods?.find((item) => item.method_type === methodKey);

      let detectedType: AccountType = 'personal';
      if (m?.instructions_bn?.toLowerCase().includes('merchant') || m?.instructions_bn?.includes('মার্চেন্ট') || m?.instructions_bn?.includes('Payment')) {
        detectedType = 'merchant';
      }

      next[methodKey] = {
        account_number: m?.account_number || '',
        account_name: m?.account_name || 'সময়ের বাতিঘর',
        account_type: detectedType,
        instructions_bn: m?.instructions_bn || '',
        is_active: m?.is_active ?? (['bkash', 'nagad', 'rocket'].includes(methodKey)),
        branch_name: m?.branch_name || '',
        routing_number: m?.routing_number || '',
        logo_url: logos[methodKey] || '',
      };
    });

    setFormState(next);
  }, [methods, logos]);

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
          logo_url: '',
        }),
        [field]: value,
      },
    }));
  };

  // Handler: When user selects an image file from disk for a specific gateway
  const handleFileSelectForCrop = (methodType: string, file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'bn' ? 'ভুল ফাইল ফরম্যাট' : 'Invalid File',
        description: language === 'bn' ? 'শুধুমাত্র ছবি ফাইল (PNG, JPG, SVG, WebP) নির্বাচন করুন' : 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setActiveCropMethod(methodType);
      setCropModalOpen(true);
    };
    reader.onerror = () => {
      toast({
        title: language === 'bn' ? 'ফাইল পড়তে ব্যর্থ' : 'Error Reading File',
        description: language === 'bn' ? 'ছবিটি লোড করা সম্ভব হয়নি' : 'Could not read the selected image',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  // Handler: Re-crop or adjust existing custom logo
  const handleAdjustCurrentLogo = (methodType: string) => {
    const currentLogo = formState[methodType]?.logo_url || logos[methodType];
    if (!currentLogo) return;
    setImageToCrop(currentLogo);
    setActiveCropMethod(methodType);
    setCropModalOpen(true);
  };

  // Handler: Save cropped logo blob to database with 3-tier ultra-reliable fallback
  const handleCroppedGatewayLogoSave = async (croppedBlob: Blob, _previewUrl: string) => {
    if (!activeCropMethod) return;

    setIsSavingCropped(true);
    try {
      let finalLogoUrl = '';

      // Tier 1: Upload cropped PNG to Supabase Storage 'gallery-images'
      try {
        const fileName = `gateways/${activeCropMethod}-${Date.now()}.png`;
        const { data, error } = await supabase.storage
          .from('gallery-images')
          .upload(fileName, croppedBlob, {
            contentType: 'image/png',
            upsert: true,
          });

        if (!error && data?.path) {
          const { data: urlData } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(data.path);
          if (urlData?.publicUrl) {
            finalLogoUrl = urlData.publicUrl;
          }
        }
      } catch (err1) {
        console.warn('Storage upload to gallery-images failed, trying fallback...', err1);
      }

      // Tier 2: Upload to Supabase Storage 'member-photos' if Tier 1 failed
      if (!finalLogoUrl) {
        try {
          const fileName = `gateways/${activeCropMethod}-${Date.now()}.png`;
          const { data, error } = await supabase.storage
            .from('member-photos')
            .upload(fileName, croppedBlob, {
              contentType: 'image/png',
              upsert: true,
            });

          if (!error && data?.path) {
            const { data: urlData } = supabase.storage
              .from('member-photos')
              .getPublicUrl(data.path);
            if (urlData?.publicUrl) {
              finalLogoUrl = urlData.publicUrl;
            }
          }
        } catch (err2) {
          console.warn('Storage upload to member-photos failed, using Base64 Data URL fallback...', err2);
        }
      }

      // Tier 3: Zero-Failure Fallback - Convert cropped blob to Base64 Data URL
      // A 256x256-384x384 PNG is ~20KB-40KB, which stores directly in Postgres JSONB site_settings without any external storage dependency!
      if (!finalLogoUrl) {
        finalLogoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert blob to data URL'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(croppedBlob);
        });
      }

      // 1. Update local form state immediately
      updateField(activeCropMethod, 'logo_url', finalLogoUrl);

      // 2. Persist to site_settings via usePaymentGatewayLogos
      const updatedLogos: PaymentGatewayLogos = {
        ...logos,
        [activeCropMethod]: finalLogoUrl,
      };
      await saveLogos(updatedLogos);

      // 3. Invalidate queries so member panel, payment page, and admin panel sync instantly
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY_PAYMENT_LOGOS] });
      queryClient.invalidateQueries({ queryKey: ['public-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });

      toast({
        title: language === 'bn' ? 'লোগো সফলভাবে সংরক্ষিত!' : 'Logo Saved!',
        description: language === 'bn'
          ? `${BRAND_THEMES[activeCropMethod]?.label || activeCropMethod}-এর লোগো নিখুঁতভাবে ক্রপ ও ডেটাবেজে সিঙ্ক হয়েছে।`
          : 'Payment gateway logo cropped and synced successfully.',
      });

      setCropModalOpen(false);
      setActiveCropMethod(null);
      setImageToCrop(null);
    } catch (err: any) {
      console.error('Failed to save gateway logo:', err);
      toast({
        title: language === 'bn' ? 'সংরক্ষণ ব্যর্থ' : 'Save Failed',
        description: err.message || 'Error saving cropped logo',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCropped(false);
    }
  };

  // Remove custom logo and restore default SVG
  const handleResetLogo = async (methodType: string) => {
    updateField(methodType, 'logo_url', '');
    const updatedLogos: PaymentGatewayLogos = {
      ...logos,
      [methodType]: '',
    };
    await saveLogos(updatedLogos);
    toast({
      title: language === 'bn' ? 'ডিফল্ট লোগো সক্রিয়' : 'Default Logo Restored',
      description: language === 'bn' ? 'অফিসিয়াল ডিফল্ট ভেক্টর লোগো কার্যকর করা হয়েছে।' : 'Default vector logo restored.',
    });
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
      title: language === 'bn' ? 'AI নির্দেশিকা তৈরি!' : 'AI Generated!',
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
      // 1. Save method to database
      if (record) {
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
        const sortIndex = ALL_METHOD_KEYS.indexOf(methodType) + 1;
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
            sort_order: sortIndex > 0 ? sortIndex : 10,
          });

        if (error) throw error;
      }

      // 2. Save custom logo URL to site_settings if changed
      if (data.logo_url !== logos[methodType]) {
        const updatedLogos: PaymentGatewayLogos = {
          ...logos,
          [methodType]: data.logo_url || '',
        };
        await saveLogos(updatedLogos);
      }

      // 3. Invalidate queries for instant live propagation
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['public-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      refetch();

      toast({
        title: language === 'bn' ? 'সফল!' : 'Saved!',
        description: language === 'bn'
          ? `${BRAND_THEMES[methodType]?.label || methodType} গেটওয়ে সফলভাবে সংরক্ষিত হয়েছে। সদস্য প্যানেলে এটি রিয়েল-টাইমে কার্যকর হয়েছে।`
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

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-emerald-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'সরাসরি গেটওয়ে ও লোগো নিয়ন্ত্রণ' : 'Live Gateway & Logo Controller'}</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#0B6B3A]" />
            {language === 'bn' ? 'পেমেন্ট গেটওয়ে কন্ট্রোল ও লোগো সেটিংস' : 'Payment Gateway & Logo Settings'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {language === 'bn'
              ? 'বিকাশ, নগদ, রকেট, উপায়, সেলফিন ও ব্যাংকের অফিসিয়াল লোগো আপলোড করুন, নম্বর এবং নির্দেশনা আপডেট করুন। যেগুলো চালু রাখবেন কেবল সেগুলোই সদস্য পেমেন্ট স্ক্রিনে রিয়েল-টাইমে দেখা যাবে।'
              : 'Upload official logos, update phone numbers, and configure payment instructions. Inactive gateways will be hidden automatically.'}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            refetch();
            refetchLogos();
          }}
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
            ? 'সদস্যরা যাতে সঠিক গেটওয়েতে টাকা পাঠাতে পারে, সেজন্য প্রতিটি গেটওয়ের জন্য আসল সচল নম্বর এবং বাংলা নির্দেশনা প্রদান করুন। আপনি চাইলে প্রতিটি গেটওয়ের জন্য নিজস্ব অফিসিয়াল ব্র্যান্ড লোগো আপলোড করতে পারবেন।'
            : 'Enter active numbers and Bengali instructions for each gateway. You can also upload official logos which will display immediately in the payment portal.'}
        </p>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ALL_METHOD_KEYS.map((methodKey) => {
          const theme = BRAND_THEMES[methodKey] || BRAND_THEMES.bkash;
          const current = formState[methodKey] || {
            account_number: '',
            account_name: 'সময়ের বাতিঘর',
            account_type: 'personal',
            instructions_bn: '',
            is_active: true,
            branch_name: '',
            routing_number: '',
            logo_url: '',
          };

          const isSaving = savingMethod === methodKey;
          const isUploading = isSavingCropped && activeCropMethod === methodKey;
          const customLogo = current.logo_url || logos[methodKey];

          return (
            <Card
              key={methodKey}
              className={`rounded-3xl overflow-hidden border-2 ${theme.border} shadow-md bg-white dark:bg-slate-900 transition-all hover:shadow-lg`}
            >
              {/* Header */}
              <div className={`p-4 sm:p-5 text-white flex items-center justify-between ${theme.headerColor}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
                    {customLogo ? (
                      <img
                        src={customLogo}
                        alt={theme.label}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      theme.defaultLogoComponent
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg leading-tight">
                      {language === 'bn' ? theme.label : theme.labelEn}
                    </h3>
                    <p className="text-[11px] text-white/90 font-medium mt-0.5">
                      {current.is_active
                        ? (language === 'bn' ? '● লাইভ গেটওয়ে (ইউজারদের দেখাবে)' : '● LIVE Gateway (Visible)')
                        : (language === 'bn' ? '○ নিষ্ক্রিয় (ইউজারদের লুকানো থাকবে)' : '○ Inactive (Hidden)')}
                    </p>
                  </div>
                </div>

                {/* Active Switch */}
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Switch
                    checked={current.is_active}
                    onCheckedChange={(val) => updateField(methodKey, 'is_active', val)}
                    className="data-[state=checked]:bg-emerald-400"
                  />
                  <span className="text-xs font-bold text-white">
                    {current.is_active ? (language === 'bn' ? 'লাইভ' : 'LIVE') : (language === 'bn' ? 'অফ' : 'OFF')}
                  </span>
                </div>
              </div>

              {/* Body */}
              <CardContent className="p-5 sm:p-6 space-y-4">

                {/* Official Logo Upload & Interactive Cropper Section */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'bn' ? 'অফিসিয়াল গেটওয়ে লোগো' : 'Official Gateway Logo'}</span>
                    </Label>
                    {customLogo && (
                      <button
                        type="button"
                        onClick={() => handleResetLogo(methodKey)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                        title="ডিফল্ট লোগো ফিরিয়ে আনুন"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Logo Preview box with hover adjust button */}
                    <div className="w-16 h-16 rounded-2xl border-2 border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 flex items-center justify-center shrink-0 shadow-xs relative group overflow-hidden">
                      {customLogo ? (
                        <img
                          src={customLogo}
                          alt="Logo preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {theme.defaultLogoComponent}
                        </div>
                      )}
                      {customLogo && (
                        <button
                          type="button"
                          onClick={() => handleAdjustCurrentLogo(methodKey)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                          title="লোগো ক্রপ ও অ্যাডজাস্ট করুন"
                        >
                          <Crop className="w-4 h-4" />
                          <span className="text-[9px] font-bold mt-0.5">{language === 'bn' ? 'ক্রপ' : 'Crop'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        id={`logo-upload-${methodKey}`}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelectForCrop(methodKey, file);
                          e.target.value = '';
                        }}
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Choose & Crop Button */}
                        <label
                          htmlFor={`logo-upload-${methodKey}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 cursor-pointer shadow-xs transition-all active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {customLogo
                              ? (language === 'bn' ? 'লোগো পরিবর্তন করুন' : 'Change Logo')
                              : (language === 'bn' ? 'লোগো নির্বাচন ও ক্রপ' : 'Upload & Crop Logo')}
                          </span>
                        </label>

                        {/* Adjust / Re-crop Button if custom logo is already set */}
                        {customLogo && (
                          <button
                            type="button"
                            onClick={() => handleAdjustCurrentLogo(methodKey)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-100 cursor-pointer shadow-xs transition-all active:scale-95"
                          >
                            <Crop className="w-3.5 h-3.5 text-teal-600" />
                            <span>{language === 'bn' ? 'ক্রপ ও অ্যাডজাস্ট' : 'Crop & Adjust'}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {customLogo ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3 stroke-[3]" />
                            {language === 'bn' ? 'কাস্টম লোগো লাইভ রয়েছে' : 'Custom logo live'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {language === 'bn' ? 'অফিসিয়াল ডিফল্ট ভেক্টর সক্রিয়' : 'Default vector active'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

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
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 h-10 px-3 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
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
                    className="text-xs rounded-xl leading-relaxed border-slate-300 dark:border-slate-700 focus:border-emerald-600 font-sans"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={() => handleSaveMethod(methodKey)}
                  disabled={isSaving}
                  className="w-full bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold h-11 rounded-xl shadow-md gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
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

      {/* Interactive Gateway Logo Cropper & Adjustment Modal */}
      <LogoCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setActiveCropMethod(null);
          setImageToCrop(null);
        }}
        imageSrc={imageToCrop}
        onCropSave={handleCroppedGatewayLogoSave}
        isSaving={isSavingCropped}
        title={
          activeCropMethod && BRAND_THEMES[activeCropMethod]
            ? `${language === 'bn' ? BRAND_THEMES[activeCropMethod].label : BRAND_THEMES[activeCropMethod].labelEn} - ${language === 'bn' ? 'লোগো ক্রপ ও অ্যাডজাস্ট' : 'Crop & Adjust Logo'}`
            : undefined
        }
        subtitle={
          language === 'bn'
            ? 'লোগোর মূল আইকন ও লেখা সেন্টারে রেখে জুম ও ক্রপ করুন। এটি পেমেন্ট পেজে ও অ্যাপে একদম নিখুঁত দেখাবে।'
            : 'Center and zoom the gateway emblem. It will fit proportionally on mobile and desktop.'
        }
        defaultCropShape="rect"
        defaultAspect={1}
      />
    </div>
  );
};

export default PaymentGateways;
