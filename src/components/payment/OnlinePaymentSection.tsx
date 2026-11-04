import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { usePaymentGatewayLogos } from '@/hooks/usePaymentGatewayLogos';
import { 
  Home, 
  X, 
  Headphones, 
  RotateCcw, 
  Info, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck,
  Receipt,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { 
  BkashLogo, 
  NagadLogo, 
  RocketLogo, 
  UpayLogo, 
  CellfinLogo, 
  TapLogo 
} from './PaymentLogos';

export type PaymentMethodId = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'cellfin' | 'tap';

export interface PaymentOption {
  id: PaymentMethodId;
  name: string;
  nameBn: string;
  type: string;
  logo: React.ReactNode;
  brandColor: string;
  bgLight: string;
  active: boolean;
}

export const BASE_PAYMENT_METHODS: PaymentOption[] = [
  {
    id: 'bkash',
    name: 'Bkash Personal',
    nameBn: 'বিকাশ পার্সোনাল',
    type: 'Mobile Banking',
    logo: <BkashLogo className="w-8 h-8" />,
    brandColor: '#E2136E',
    bgLight: 'bg-pink-50 hover:border-[#E2136E]',
    active: true,
  },
  {
    id: 'nagad',
    name: 'Nagad Personal',
    nameBn: 'নগদ পার্সোনাল',
    type: 'Mobile Banking',
    logo: <NagadLogo className="w-8 h-8" />,
    brandColor: '#ED1C24',
    bgLight: 'bg-orange-50 hover:border-[#ED1C24]',
    active: true,
  },
  {
    id: 'rocket',
    name: 'Rocket Personal',
    nameBn: 'রকেট পার্সোনাল',
    type: 'Mobile Banking',
    logo: <RocketLogo className="w-8 h-8" />,
    brandColor: '#8C3494',
    bgLight: 'bg-purple-50 hover:border-[#8C3494]',
    active: true,
  },
  {
    id: 'upay',
    name: 'Upay Personal',
    nameBn: 'উপায় পার্সোনাল',
    type: 'Mobile Banking',
    logo: <UpayLogo className="w-8 h-8" />,
    brandColor: '#002D62',
    bgLight: 'bg-blue-50 hover:border-[#002D62]',
    active: true,
  },
  {
    id: 'cellfin',
    name: 'Cellfin Personal',
    nameBn: 'সেলফিন পার্সোনাল',
    type: 'Mobile Banking',
    logo: <CellfinLogo className="w-8 h-8" />,
    brandColor: '#00843D',
    bgLight: 'bg-emerald-50 hover:border-[#00843D]',
    active: true,
  },
  {
    id: 'tap',
    name: 'Tap Personal',
    nameBn: 'ট্যাপ পার্সোনাল',
    type: 'Mobile Banking',
    logo: <TapLogo className="w-8 h-8" />,
    brandColor: '#E31E24',
    bgLight: 'bg-red-50 hover:border-[#E31E24]',
    active: true,
  },
];

interface OnlinePaymentSectionProps {
  amount: number;
  dueId?: string | null;
  purpose?: string;
  onSelectPayment: (method: PaymentMethodId, amount: number) => void;
  onClose?: () => void;
  className?: string;
}

export const OnlinePaymentSection: React.FC<OnlinePaymentSectionProps> = ({
  amount = 0,
  dueId,
  purpose = 'সদস্য মাসিক চাঁদা',
  onSelectPayment,
  onClose,
  className = '',
}) => {
  const { language } = useLanguage();
  const { logoUrl } = useSiteLogo();
  const { logos: customLogos } = usePaymentGatewayLogos();
  const navigate = useNavigate();

  // Fetch live active methods from database
  const { data: dbMethods, isLoading: isDbLoading } = useQuery({
    queryKey: ['public-payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  // Filter to show ONLY active gateways configured in database
  const activeGateways = React.useMemo(() => {
    if (!dbMethods || dbMethods.length === 0) {
      // Fallback: If no records yet, show default mobile methods
      return BASE_PAYMENT_METHODS.filter((m) => ['bkash', 'nagad', 'rocket'].includes(m.id));
    }

    return BASE_PAYMENT_METHODS.filter((baseMethod) => {
      const dbMatch = dbMethods.find((db) => db.method_type === baseMethod.id);
      // If found in DB, respect is_active flag; if not found in DB, keep inactive
      return dbMatch ? dbMatch.is_active === true : false;
    });
  }, [dbMethods]);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('bkash');

  // Auto-select first active gateway when active list updates
  useEffect(() => {
    if (activeGateways.length > 0) {
      const isCurrentActive = activeGateways.some((m) => m.id === selectedMethod);
      if (!isCurrentActive) {
        setSelectedMethod(activeGateways[0].id);
      }
    }
  }, [activeGateways, selectedMethod]);

  const handlePayNow = () => {
    if (!selectedMethod || activeGateways.length === 0) return;
    onSelectPayment(selectedMethod, amount);
  };

  const handleExit = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`w-full max-w-sm sm:max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden font-sans transition-all ${className}`}>
      
      {/* Top Mobile-styled Navigation Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/50">
        <button
          type="button"
          onClick={() => navigate('/member/dues')}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          title="চাঁদা তালিকায় ফিরে যান"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Gateway • সময়ের বাতিঘর</span>
        </div>

        <button
          type="button"
          onClick={handleExit}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Merchant / Organization Branding Header */}
      <div className="pt-6 pb-3 px-6 text-center space-y-2.5">
        <div className="relative inline-block">
          <div className="w-16 h-16 rounded-full mx-auto p-1 bg-gradient-to-tr from-emerald-500 via-teal-500 to-[#0B6B3A] shadow-md shadow-emerald-500/20">
            <img
              src={logoUrl || "/logo.png"}
              alt="সময়ের বাতিঘর"
              className="w-full h-full object-contain rounded-full bg-white p-0.5"
            />
          </div>
          <span className="absolute bottom-0 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white" />
        </div>

        <div>
          <h2 className="text-lg font-heading font-extrabold text-slate-900 dark:text-slate-100">
            সময়ের বাতিঘর
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            একটি সামাজিক স্বেচ্ছাসেবী সংগঠন (চাঁদা পেমেন্ট পোর্টাল)
          </p>
        </div>

        {/* 3 Action Buttons matching Reference Image 1 */}
        <div className="flex items-center justify-center gap-3 pt-0.5">
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors shadow-xs cursor-pointer"
            title="সহায়তা / হেল্পলাইন"
          >
            <Headphones className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shadow-xs cursor-pointer"
            title="রিফ্রেশ"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/about')}
            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            title="সংগঠনের তথ্য"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Payment Selection Box */}
      <div className="px-5 pb-6 space-y-3.5">
        
        {/* Dark Pill Header Banner (Exact layout of Image 1) */}
        <div className="w-full py-3 px-4 rounded-xl bg-[#1E293B] text-white text-center shadow-md">
          <p className="text-sm font-bold tracking-wide">
            পেমেন্ট পদ্ধতি নির্বাচন করুন
          </p>
        </div>

        {/* Subtitle Pill Banner */}
        <div className="w-full py-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold tracking-wide">Mobile Banking</span>
        </div>

        {/* Live Active Gateways Grid (Only active ones rendered) */}
        {activeGateways.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            {activeGateways.map((method) => {
              const isSelected = selectedMethod === method.id;
              const customLogoUrl = customLogos[method.id];

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`relative p-3 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer group ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/30 shadow-md'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Red LIVE Badge on Top-Right */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-600 text-white shadow-xs">
                      LIVE
                    </span>
                  </div>

                  {/* Selected Checkmark Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 text-blue-600">
                      <CheckCircle2 className="w-4 h-4 fill-blue-600 text-white" />
                    </div>
                  )}

                  {/* Brand Logo (Official Uploaded Logo OR Vector Fallback) */}
                  <div className="w-12 h-12 flex items-center justify-center my-0.5 group-hover:scale-105 transition-transform">
                    {customLogoUrl ? (
                      <img
                        src={customLogoUrl}
                        alt={method.name}
                        className="w-10 h-10 object-contain drop-shadow-xs"
                      />
                    ) : (
                      method.logo
                    )}
                  </div>

                  {/* Brand Label */}
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {method.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
              বর্তমানে কোনো অনলাইন পেমেন্ট গেটওয়ে সক্রিয় নেই।
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে গেটওয়ে সক্রিয় করুন অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।
            </p>
          </div>
        )}

        {/* Automatic Prefilled Dues Summary */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border border-emerald-200/80 dark:border-slate-700 flex items-center justify-between shadow-xs">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
              {language === 'bn' ? 'চাঁদার বিবরণ' : 'Dues Purpose'}
            </span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {purpose}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {language === 'bn' ? 'প্রদেয় পরিমাণ' : 'Amount Due'}
            </span>
            <span className="text-lg font-black text-emerald-600 font-mono">
              ৳{amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Large Signature Blue Pay Button (Exact layout of Image 1) */}
        <button
          type="button"
          onClick={handlePayNow}
          disabled={activeGateways.length === 0}
          className="w-full mt-1 py-3.5 px-6 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Pay ৳{amount.toFixed(2)}</span>
        </button>

        {/* Trust Badge */}
        <div className="text-center pt-0.5">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>১০০% নিরাপদ ও এনক্রিপ্টেড পেমেন্ট প্রসেসিং</span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default OnlinePaymentSection;
