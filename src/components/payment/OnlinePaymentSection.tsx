import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { 
  Home, 
  X, 
  Headphones, 
  RotateCcw, 
  Info, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  CreditCard
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

export const PAYMENT_METHODS: PaymentOption[] = [
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
  initialAmount?: number;
  initialMethod?: PaymentMethodId;
  dueId?: string | null;
  purpose?: string;
  onSelectPayment?: (method: PaymentMethodId, amount: number) => void;
  className?: string;
  isStandalone?: boolean;
}

export const OnlinePaymentSection: React.FC<OnlinePaymentSectionProps> = ({
  initialAmount = 10,
  initialMethod = 'bkash',
  dueId,
  purpose = 'সাধারণ তহবিল / অনুদান ও চাঁদা',
  onSelectPayment,
  className = '',
  isStandalone = false,
}) => {
  const { language } = useLanguage();
  const { logoUrl } = useSiteLogo();
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>(initialMethod);
  const [amount, setAmount] = useState<number>(initialAmount);
  const [customAmount, setCustomAmount] = useState<string>(String(initialAmount));
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const PRESET_AMOUNTS = [10, 50, 100, 500, 1000];

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount(String(val));
    setIsCustomMode(false);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handlePayNow = () => {
    if (onSelectPayment) {
      onSelectPayment(selectedMethod, amount);
    } else {
      const params = new URLSearchParams();
      params.set('method', selectedMethod);
      params.set('amount', String(amount));
      if (dueId) params.set('dueId', dueId);
      if (purpose) params.set('purpose', purpose);
      navigate(`/payment?${params.toString()}`);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden font-sans transition-all ${className}`}>
      
      {/* Top Mobile-styled Navigation Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
          title="হোম পেজে যান"
        >
          <Home className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Gateway • সময়ের বাতিঘর</span>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Merchant / Organization Branding Header */}
      <div className="pt-6 pb-4 px-6 text-center space-y-3">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full mx-auto p-1 bg-gradient-to-tr from-emerald-500 via-teal-500 to-[#0B6B3A] shadow-lg shadow-emerald-500/20">
            <img
              src={logoUrl || "/logo.png"}
              alt="সময়ের বাতিঘর"
              className="w-full h-full object-contain rounded-full bg-white p-1"
            />
          </div>
          <span className="absolute bottom-0 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white" />
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
            <span>সময়ের বাতিঘর</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            একটি সামাজিক স্বেচ্ছাসেবী সংগঠন (অফিসিয়াল পেমেন্ট পোর্টাল)
          </p>
        </div>

        {/* 3 Action Buttons matching Reference Image 1 */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
            title="সহায়তা / হেল্পলাইন"
          >
            <Headphones className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
            title="রিফ্রেশ"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/about')}
            className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
            title="সংগঠনের তথ্য"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Payment Selection Box */}
      <div className="px-5 pb-6 space-y-4">
        
        {/* Dark Pill Header Banner (Exact layout of Image 1) */}
        <div className="w-full py-3 px-4 rounded-xl bg-[#1E293B] text-white text-center shadow-md">
          <p className="text-sm font-bold tracking-wide">
            পেমেন্ট পদ্ধতি নির্বাচন করুন
          </p>
        </div>

        {/* Subtitle Pill Banner */}
        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold tracking-wide">Mobile Banking</span>
        </div>

        {/* 6 Gateway Selection Grid (Exact layout & LIVE badges of Image 1) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer group ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/30 shadow-md'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 hover:shadow-sm'
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

                {/* Brand Logo */}
                <div className="w-12 h-12 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                  {method.logo}
                </div>

                {/* Brand Label */}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {method.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Amount Selection & Input */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>পেমেন্টের পরিমাণ (টাকা):</span>
            <span className="text-emerald-600 font-extrabold">৳{amount.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleAmountSelect(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  amount === val && !isCustomMode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                ৳{val}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isCustomMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              অন্যান্য
            </button>
          </div>

          {isCustomMode && (
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
              <input
                type="text"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="টাকার পরিমাণ লিখুন"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
              />
            </div>
          )}
        </div>

        {/* Large Signature Blue Pay Button (Exact layout of Image 1) */}
        <button
          type="button"
          onClick={handlePayNow}
          className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.99] text-white font-extrabold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Pay ৳{amount.toFixed(2)}</span>
        </button>

        {/* Trust Badges */}
        <div className="text-center pt-1">
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

