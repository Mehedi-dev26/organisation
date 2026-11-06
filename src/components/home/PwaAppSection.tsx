import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  BellRing, 
  HardDrive, 
  Share2, 
  PlusSquare, 
  ArrowRight, 
  Sprout,
  Check,
  Info,
  X,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { toast } from 'sonner';

export const PwaAppSection: React.FC = () => {
  const { language } = useLanguage();
  const { isInstallable, isInstalled, isIOS, isAndroid, triggerInstall } = usePwaInstall();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'installed'>(
    isInstalled ? 'installed' : 'idle'
  );

  const handleInstallClick = async () => {
    if (isInstalled || installState === 'installed') {
      toast.success(
        language === 'bn' 
          ? 'অ্যাপটি ইতিমধ্যে আপনার ডিভাইসে ইনস্টল করা আছে!' 
          : 'App is already installed on your device!'
      );
      return;
    }

    setInstallState('installing');
    const result = await triggerInstall();

    if (result === 'accepted') {
      setInstallState('installed');
      toast.success(
        language === 'bn' 
          ? 'অভিনন্দন! সময়ের বাতিঘর অ্যাপটি সফলভাবে ইনস্টল হয়েছে।' 
          : 'Congratulations! Somoyer Batighor App installed successfully.'
      );
    } else if (result === 'manual_instructions' || isIOS) {
      setInstallState('idle');
      // Open step-by-step installation guide dialog
      setIsGuideOpen(true);
    } else {
      setInstallState('idle');
      toast.info(
        language === 'bn'
          ? 'ইনস্টলেশন বাতিল করা হয়েছে। প্রয়োজনে নির্দেশিকা দেখতে পারেন।'
          : 'Installation dismissed.'
      );
    }
  };

  const features = [
    {
      icon: Zap,
      titleBn: 'বিদ্যুৎ গতির পারফরম্যান্স',
      titleEn: 'Lightning Fast Performance',
      descBn: 'আধুনিক প্রযুক্তিতে তৈরি হওয়ায় দুর্বল ইন্টারনেটেও পলকে লোড হয়।',
      descEn: 'Instant millisecond load times even on slow 2G/3G mobile networks.'
    },
    {
      icon: BellRing,
      titleBn: 'তাৎক্ষণিক পুশ নোটিফিকেশন',
      titleEn: 'Instant Push Alerts',
      descBn: 'জরুরি রক্তদানের আহ্বান, নোটিস ও বকেয়া চাঁদার রিমাইন্ডার সরাসরি ফোনে আসবে।',
      descEn: 'Direct phone alerts for blood emergencies, notices, and due updates.'
    },
    {
      icon: HardDrive,
      titleBn: 'জিরো স্টোরেজ প্রেসার (মাত্র ২MB)',
      titleEn: 'Ultra-Lightweight (<2MB)',
      descBn: 'ভারী অ্যাপের মতো ফোনের র‍্যাম বা মেমোরি খরচ করে না, অত্যন্ত হালকা ও স্মুথ।',
      descEn: 'Takes virtually zero phone storage compared to bulky app store downloads.'
    },
    {
      icon: ShieldCheck,
      titleBn: 'প্লে স্টোর ছাড়া এক ক্লিকে ইনস্টল',
      titleEn: 'Zero-Store 1-Tap Install',
      descBn: 'কোনো পাসওয়ার্ড বা ইমেইল অ্যাকাউন্ট ছাড়াই সরাসরি ব্রাউজার থেকে সুরক্ষিত ইনস্টল।',
      descEn: 'No app store account needed; directly install to your home screen.'
    }
  ];

  return (
    <section 
      id="pwa-app-section"
      className="relative w-full overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F4FAF5] to-[#FFFFFF] py-16 sm:py-20 lg:py-24 border-b border-emerald-950/5"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          {/* Top Pill Badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] shadow-xs">
              <span className="w-5 h-5 rounded-full bg-[#0B6B3A] flex items-center justify-center text-white flex-shrink-0">
                <Smartphone className="w-3.5 h-3.5" />
              </span>
              <span className="text-[#0B6B3A] text-xs sm:text-sm font-semibold tracking-wide">
                {language === 'bn' ? 'অফিসিয়াল মোবাইল অ্যাপ • পিডব্লিউএ (PWA)' : 'Official Mobile App • Progressive Web App'}
              </span>
            </div>
          </div>

          {/* Main Two-Tone Heading with SVG Underline & Sparkles */}
          <div className="inline-flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap">
            {/* Left Leaf Sparkle */}
            <svg 
              className="w-6 h-6 sm:w-8 sm:h-8 text-[#0B6B3A] flex-shrink-0 hidden xs:inline-block" 
              viewBox="0 0 24 24" 
              fill="none" 
              aria-hidden="true"
            >
              <path d="M19 16C14 15 9.5 12 6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M17 21C12.5 20.5 8 18 3 13.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M21 11C16 10 11.5 7 8 2" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              <span className="text-[#14231B]">
                {language === 'bn' ? 'স্মার্টফোনে ব্যবহার করুন ' : 'Experience the '}
              </span>
              <span className="text-[#0B6B3A] relative inline-block">
                {language === 'bn' ? 'সময়ের বাতিঘর অ্যাপ' : 'Official Mobile App'}
                {/* Yellow-Green Brush Stroke SVG Underline */}
                <svg 
                  className="absolute -bottom-2 md:-bottom-2.5 left-0 w-full h-3 md:h-3.5 text-[#9BD038] pointer-events-none" 
                  viewBox="0 0 240 14" 
                  fill="none" 
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M3 10C52 4 172 3 237 8C194 12.2 88 12 3 10Z" fill="currentColor" opacity="0.95" />
                </svg>
              </span>
            </h2>

            {/* Right Leaf Sparkle */}
            <svg 
              className="w-6 h-6 sm:w-8 sm:h-8 text-[#0B6B3A] flex-shrink-0 -scale-x-100 hidden xs:inline-block" 
              viewBox="0 0 24 24" 
              fill="none" 
              aria-hidden="true"
            >
              <path d="M19 16C14 15 9.5 12 6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M17 21C12.5 20.5 8 18 3 13.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M21 11C16 10 11.5 7 8 2" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>

          <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-[#6B7A72] max-w-2xl mx-auto leading-relaxed">
            {language === 'bn'
              ? 'প্লে স্টোর ছাড়াই সরাসরি যেকোনো স্মার্টফোনে ইনস্টল করে নিন আমাদের অফিশিয়াল অ্যাপ। বিদ্যুৎ গতির পারফরম্যান্স এবং তাৎক্ষণিক নোটিফিকেশন এখন আপনার হাতের মুঠোয়।'
              : 'Directly install our official Progressive Web App on any smartphone without app store hassles. Enjoy ultra-fast performance and instant real-time alerts.'}
          </p>
        </div>

        {/* Big Showcase Hero Banner Card */}
        <div className="relative rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-[#062415] via-[#0A3D24] to-[#041A0E] text-white p-6 sm:p-10 lg:p-14 overflow-hidden shadow-[0_20px_60px_rgba(11,107,58,0.2)] border border-emerald-500/25">
          
          {/* Ambient Background Glows & Patterns */}
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[#11DFC0]/15 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.18),transparent_60%)] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* Left Content Area (7 Cols on Desktop) */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-bold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>
                  {language === 'bn' ? 'অফিসিয়াল পিডব্লিউএ অ্যাপ্লিকেশন' : 'Official Progressive Web App'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>

              {/* Title & Pitch */}
              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tight leading-tight mb-3">
                  {language === 'bn' ? (
                    <>
                      এক ক্লিকেই ইনস্টল করুন <br className="hidden sm:inline" />
                      <span className="text-[#9BD038]">সময়ের বাতিঘর</span> মোবাইল অ্যাপ
                    </>
                  ) : (
                    <>
                      Install in 1-Click <br className="hidden sm:inline" />
                      <span className="text-[#9BD038]">Samoyer Batighor</span> Mobile App
                    </>
                  )}
                </h3>
                <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal max-w-xl">
                  {language === 'bn'
                    ? 'অ্যাপ স্টোরে খোঁজাখুঁজির প্রয়োজন নেই। সরাসরি আপনার ফোনের স্ক্রিনে যুক্ত হয়ে যাবে একটি ফুল-ফিচার্ড নেটিভ অ্যাপের মতো। ইন্টারনেট ধীরগতির হলেও কাজ করবে স্মুথলি।'
                    : 'No searching through app stores required. Adds directly to your home screen with a full-featured native app experience, working offline and at blazing speed.'}
                </p>
              </div>

              {/* 4 Core Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                {features.map((feat, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 hover:border-emerald-400/30 transition-all backdrop-blur-xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <feat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {language === 'bn' ? feat.titleBn : feat.titleEn}
                      </h4>
                      <p className="text-xs text-emerald-200/80 leading-relaxed mt-0.5">
                        {language === 'bn' ? feat.descBn : feat.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 pt-2">
                {/* 1. Direct Install Button */}
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={installState === 'installing'}
                  className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-900/40 hover:shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-emerald-300/30"
                >
                  {isInstalled || installState === 'installed' ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-200" />
                      <span>{language === 'bn' ? 'অ্যাপটি ইনস্টল রয়েছে' : 'App Installed'}</span>
                    </>
                  ) : installState === 'installing' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'bn' ? 'ইনস্টল হচ্ছে...' : 'Installing...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 text-white animate-bounce" />
                      <span>{language === 'bn' ? 'ডিরেক্ট অ্যাপ ইনস্টল করুন' : 'Direct Install App'}</span>
                    </>
                  )}
                </button>

                {/* 2. Manual Installation Guide Button */}
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-emerald-100 hover:text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
                >
                  <Info className="w-4 h-4 text-emerald-300" />
                  <span>{language === 'bn' ? 'ইনস্টলেশন নির্দেশিকা' : 'How to Install?'}</span>
                </button>
              </div>

              {/* Platform indicators */}
              <div className="flex items-center gap-4 text-xs text-emerald-300/80 pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Android
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> iPhone / iPad
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Windows / Mac
                </span>
              </div>
            </div>

            {/* Right Side: Realistic Sleek Smartphone Mockup (5 Cols on Desktop) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
              
              {/* Floating Pill Accent 1: Fast */}
              <div className="absolute -top-4 -left-2 sm:-left-6 z-20 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-xl backdrop-blur-md animate-bounce" style={{ animationDuration: '4s' }}>
                <Zap className="w-4 h-4 text-amber-400" />
                <span>মিলি-সেকেন্ডে লোড</span>
              </div>

              {/* Floating Pill Accent 2: Size */}
              <div className="absolute -bottom-3 -right-2 sm:-right-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-xl backdrop-blur-md animate-bounce" style={{ animationDuration: '5s' }}>
                <HardDrive className="w-4 h-4 text-teal-300" />
                <span>মাত্র ২ MB সাইজ</span>
              </div>

              {/* Floating Pill Accent 3: Push */}
              <div className="absolute top-1/2 -right-4 sm:-right-8 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl">
                <BellRing className="w-3.5 h-3.5 text-amber-300" />
                <span>লাইভ নোটিফিকেশন</span>
              </div>

              {/* Smartphone Frame Outer Shell */}
              <div className="relative w-[270px] sm:w-[290px] h-[530px] sm:h-[570px] bg-slate-950 rounded-[44px] p-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.7)] border-4 border-slate-700/60 ring-1 ring-white/20 select-none">
                
                {/* Smartphone Bezel & Inner Screen */}
                <div className="w-full h-full bg-gradient-to-b from-[#062415] via-[#0A3D24] to-[#041A0E] rounded-[36px] overflow-hidden flex flex-col justify-between relative border border-emerald-500/30">
                  
                  {/* Dynamic Island / Notch */}
                  <div className="pt-2 px-6 flex justify-between items-center text-[10px] text-white/80 z-20">
                    <span className="font-semibold tracking-tight">09:41</span>
                    <div className="w-20 h-4 bg-black rounded-full flex items-center justify-end px-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <div className="w-4 h-2 border border-white/80 rounded-xs p-0.5">
                        <div className="w-full h-full bg-white" />
                      </div>
                    </div>
                  </div>

                  {/* App Screen Content */}
                  <div className="px-4 py-4 flex-1 flex flex-col justify-between relative z-10 text-center">
                    
                    {/* Top Organization Brand Card */}
                    <div className="pt-2">
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-2.5">
                        <img 
                          src="/logo-round.png" 
                          alt="সময়ের বাতিঘর" 
                          className="w-full h-full object-contain rounded-full shadow-lg border-2 border-white/80 bg-white"
                        />
                        <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      </div>
                      
                      <h4 className="font-heading font-black text-white text-base sm:text-lg leading-tight">
                        সময়ের বাতিঘর
                      </h4>
                      <p className="text-[11px] text-[#9BD038] font-bold tracking-wide mt-0.5">
                        একতাই শক্তি, সেবাই ধর্ম
                      </p>

                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] text-emerald-200 border border-white/15">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>অফিসিয়াল মোবাইল অ্যাপ্লিকেশন</span>
                      </div>
                    </div>

                    {/* Mini App UI Feature Cards */}
                    <div className="space-y-2 py-2">
                      <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-between text-left">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs">
                            🩸
                          </span>
                          <span className="text-xs font-bold text-white">জরুরি রক্তদাতা খুঁজুন</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">সক্রিয়</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-between text-left">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">
                            👥
                          </span>
                          <span className="text-xs font-bold text-white">সদস্য ড্যাশবোর্ড ও নোটিস</span>
                        </div>
                        <span className="text-[10px] text-amber-300 font-semibold">আপডেট</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-between text-left">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">
                            💳
                          </span>
                          <span className="text-xs font-bold text-white">চাঁদা ও অনলাইন অনুদান</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">সুরক্ষিত</span>
                      </div>
                    </div>

                    {/* Bottom Phone Action Button (Direct Trigger on Mockup) */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleInstallClick}
                        className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 border border-emerald-300/30 cursor-pointer"
                      >
                        <Download className="w-4 h-4 animate-bounce" />
                        <span>{language === 'bn' ? 'সরাসরি ইনস্টল করুন' : 'Direct Install App'}</span>
                      </button>
                      <p className="text-[9.5px] text-emerald-200/60 mt-1">
                        Android • iOS • Windows এ সাপোর্ট করে
                      </p>
                    </div>

                  </div>

                  {/* Phone Home Bar at bottom */}
                  <div className="pb-1.5 flex justify-center">
                    <div className="w-24 h-1 bg-white/40 rounded-full" />
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Step-by-Step Installation Guide Modal (For iOS Safari or Manual Setup) */}
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full p-0 overflow-hidden rounded-[28px] border-emerald-950/10 shadow-2xl bg-white">
          
          {/* Header with App Logo */}
          <div className="bg-gradient-to-br from-[#062415] via-[#0A3D24] to-[#041A0E] text-white p-6 relative">
            <button
              type="button"
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5">
              <img 
                src="/logo-round.png" 
                alt="বাতিঘর" 
                className="w-12 h-12 rounded-full border-2 border-white/80 bg-white" 
              />
              <div>
                <span className="text-[11px] font-bold text-[#9BD038] tracking-wider uppercase">
                  PWA Installation Guide
                </span>
                <DialogTitle className="text-xl font-bold font-heading text-white">
                  {language === 'bn' ? 'কীভাবে অ্যাপটি ইনস্টল করবেন?' : 'How to Install the App?'}
                </DialogTitle>
              </div>
            </div>
          </div>

          {/* Guide Steps */}
          <div className="p-6 space-y-5 text-left max-h-[75vh] overflow-y-auto">
            
            {/* Android / Chrome Section */}
            <div className="p-4 rounded-2xl bg-[#F4FAF5] border border-[#C8E6C9] space-y-2.5">
              <div className="flex items-center gap-2 text-[#0B6B3A] font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-[#0B6B3A] text-white flex items-center justify-center text-xs">১</span>
                <span>অ্যান্ড্রয়েড ফোন (Android / Chrome / Samsung Internet)</span>
              </div>
              <ul className="text-xs sm:text-sm text-[#2C4A3E] space-y-1.5 pl-8 list-disc">
                <li>উপরে দেওয়া <strong>"ডিরেক্ট অ্যাপ ইনস্টল করুন"</strong> বাটনে চাপ দিন।</li>
                <li>অথবা ব্রাউজারের উপরে ডানদিকের <strong>তিনটি ডট (⋮)</strong> মেনুতে ক্লিক করুন।</li>
                <li>মেনু থেকে <strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> চাপুন।</li>
                <li>কয়েক সেকেন্ডের মধ্যেই অ্যাপটি আপনার ফোনে ইনস্টল হয়ে যাবে।</li>
              </ul>
            </div>

            {/* iPhone / iPad / Safari Section */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">২</span>
                <span>আইফোন / আইপ্যাড (iPhone / iPad - Safari)</span>
              </div>
              <ul className="text-xs sm:text-sm text-amber-950 space-y-1.5 pl-8 list-disc">
                <li>সাফারি ব্রাউজারের নিচের <strong>শেয়ার আইকন ( <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> Share )</strong> এ ট্যাপ করুন।</li>
                <li>নিচে স্ক্রল করে <strong>"Add to Home Screen" ( <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" /> হোম স্ক্রিনে যোগ করুন )</strong> নির্বাচন করুন।</li>
                <li>উপরে ডানদিকে <strong>"Add"</strong> বাটনে ক্লিক করলেই হোম স্ক্রিনে বাতিঘর অ্যাপ আইকন চলে আসবে।</li>
              </ul>
            </div>

            {/* Computer / Desktop Section */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs">৩</span>
                <span>কম্পিউটার (Windows / Mac / Chrome / Edge)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 pl-8 leading-relaxed">
                ব্রাউজারের অ্যাড্রেস বারের ডান পাশে থাকা <strong>ইনস্টল আইকনে (Install icon)</strong> ক্লিক করলেই ডেস্কটপ অ্যাপ হিসেবে ওপেন হয়ে যাবে।
              </p>
            </div>

            {/* Dialog Footer Action */}
            <div className="pt-2 flex justify-between items-center">
              <Button
                onClick={handleInstallClick}
                className="bg-[#0B6B3A] hover:bg-[#09572F] text-white rounded-full px-5 py-2 text-xs sm:text-sm font-bold gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'bn' ? 'এখনই ইনস্টল করুন' : 'Install Now'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsGuideOpen(false)}
                className="rounded-full px-5 py-2 text-xs sm:text-sm border-slate-200"
              >
                {language === 'bn' ? 'বুঝেছি / বন্ধ করুন' : 'Got it / Close'}
              </Button>
            </div>

          </div>

        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PwaAppSection;
