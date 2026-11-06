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
  HeartHandshake,
  Users,
  Droplet
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

  // 4 Features with unique individual color schemes and icons
  const features = [
    {
      icon: Zap,
      iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      cardHover: 'hover:border-amber-300 hover:bg-amber-50/30',
      titleBn: 'বিদ্যুৎ গতির পারফরম্যান্স',
      titleEn: 'Lightning Fast Performance',
      descBn: 'আধুনিক প্রযুক্তিতে তৈরি হওয়ায় দুর্বল ২G/৩G নেটওয়ার্কেও পলকে লোড হয়।',
      descEn: 'Instant millisecond load times even on slow 2G/3G mobile networks.'
    },
    {
      icon: BellRing,
      iconBg: 'bg-purple-100 text-purple-600 border-purple-200',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      cardHover: 'hover:border-purple-300 hover:bg-purple-50/30',
      titleBn: 'তাৎক্ষণিক পুশ নোটিফিকেশন',
      titleEn: 'Instant Push Alerts',
      descBn: 'জরুরি রক্তদানের আহ্বান, নতুন নোটিস ও বকেয়া চাঁদার রিমাইন্ডার সরাসরি ফোনে আসবে।',
      descEn: 'Direct phone alerts for blood emergencies, notices, and due updates.'
    },
    {
      icon: HardDrive,
      iconBg: 'bg-sky-100 text-sky-600 border-sky-200',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      cardHover: 'hover:border-sky-300 hover:bg-sky-50/30',
      titleBn: 'জিরো স্টোরেজ প্রেসার (মাত্র ২MB)',
      titleEn: 'Ultra-Lightweight (<2MB)',
      descBn: 'ভারী অ্যাপের মতো ফোনের র‍্যাম বা মেমোরি নষ্ট করে না, একদম হালকা ও দ্রুতগতির।',
      descEn: 'Takes virtually zero phone storage compared to bulky app store downloads.'
    },
    {
      icon: ShieldCheck,
      iconBg: 'bg-emerald-100 text-[#0B6B3A] border-emerald-200',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      cardHover: 'hover:border-emerald-300 hover:bg-emerald-50/30',
      titleBn: 'প্লে স্টোর ছাড়া এক ক্লিকে ইনস্টল',
      titleEn: 'Zero-Store 1-Tap Install',
      descBn: 'কোনো পাসওয়ার্ড বা স্টোর অ্যাকাউন্ট ছাড়াই সরাসরি ব্রাউজার থেকে ১০০% সুরক্ষিত ইনস্টল।',
      descEn: 'No app store account needed; directly install to your home screen.'
    }
  ];

  return (
    <section 
      id="pwa-app-section"
      className="relative w-full overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F4FAF6] to-[#FFFFFF] py-16 sm:py-20 lg:py-24 border-b border-emerald-950/5"
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

        {/* Big Showcase Hero Card with Light Theme (হালকা ব্যাকগ্রাউন্ড কালার) */}
        <div className="relative rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-[#FFFFFF] via-[#F6FBF7] to-[#ECF7EE] text-[#14231B] p-6 sm:p-10 lg:p-14 overflow-hidden shadow-[0_15px_45px_rgba(11,107,58,0.08)] border border-[#C8E6C9]">
          
          {/* Subtle Ambient Pastel Glows in Background */}
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* Left Content Area (7 Cols on Desktop) */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
              
              {/* Badge with Light Emerald Styling */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs sm:text-sm font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>
                  {language === 'bn' ? 'অফিসিয়াল পিডব্লিউএ অ্যাপ্লিকেশন' : 'Official Progressive Web App'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B3A] animate-ping" />
              </div>

              {/* Title & Pitch */}
              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tight leading-tight text-[#14231B] mb-3">
                  {language === 'bn' ? (
                    <>
                      এক ক্লিকেই ইনস্টল করুন <br className="hidden sm:inline" />
                      <span className="text-[#0B6B3A]">সময়ের বাতিঘর</span> মোবাইল অ্যাপ
                    </>
                  ) : (
                    <>
                      Install in 1-Click <br className="hidden sm:inline" />
                      <span className="text-[#0B6B3A]">Samoyer Batighor</span> Mobile App
                    </>
                  )}
                </h3>
                <p className="text-sm sm:text-base text-[#4A5850] leading-relaxed font-normal max-w-xl">
                  {language === 'bn'
                    ? 'অ্যাপ স্টোরে খোঁজাখুঁজির প্রয়োজন নেই। সরাসরি আপনার ফোনের স্ক্রিনে যুক্ত হয়ে যাবে একটি ফুল-ফিচার্ড নেটিভ অ্যাপের মতো। ইন্টারনেট ধীরগতির হলেও কাজ করবে দ্রুত ও নিখুঁতভাবে।'
                    : 'No searching through app stores required. Adds directly to your home screen with a full-featured native app experience, working offline and at blazing speed.'}
                </p>
              </div>

              {/* 4 Core Features Grid - Each with Unique Individual Icon Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                {features.map((feat, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-emerald-950/10 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xs ${feat.cardHover}`}
                  >
                    {/* Individual Unique Themed Icon Badge */}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs ${feat.iconBg}`}>
                      <feat.icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#14231B] leading-snug">
                        {language === 'bn' ? feat.titleBn : feat.titleEn}
                      </h4>
                      <p className="text-xs text-[#5A6860] leading-relaxed mt-0.5">
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
                  className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 rounded-full bg-gradient-to-r from-[#0B6B3A] via-[#0D7F45] to-[#0A5C34] hover:from-[#09572F] hover:to-[#084A2A] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-900/15 hover:shadow-emerald-700/25 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[#C8E6C9]/40"
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

                {/* 2. Manual Installation Guide Button with Light Styling */}
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-[#E6F4EA] text-[#0B6B3A] font-bold text-xs sm:text-sm border border-[#C8E6C9] shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Info className="w-4 h-4 text-[#0B6B3A]" />
                  <span>{language === 'bn' ? 'ইনস্টলেশন নির্দেশিকা' : 'How to Install?'}</span>
                </button>
              </div>

              {/* Platform indicators */}
              <div className="flex items-center gap-4 text-xs text-[#2C4A3E] font-medium pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0B6B3A]" /> Android
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0B6B3A]" /> iPhone / iPad
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0B6B3A]" /> Windows / Mac
                </span>
              </div>
            </div>

            {/* Right Side: Realistic Sleek Smartphone Mockup */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
              
              {/* Floating Pill Accent 1: Fast (Amber Themed) */}
              <div className="absolute -top-3 -left-2 sm:-left-6 z-20 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-amber-200 text-amber-800 text-xs font-bold shadow-lg shadow-amber-900/5 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>মিলি-সেকেন্ডে লোড</span>
              </div>

              {/* Floating Pill Accent 2: Size (Sky Blue Themed) */}
              <div className="absolute -bottom-2 -right-2 sm:-right-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-sky-200 text-sky-800 text-xs font-bold shadow-lg shadow-sky-900/5 animate-bounce" style={{ animationDuration: '5s' }}>
                <div className="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center text-sky-600">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <span>মাত্র ২ MB সাইজ</span>
              </div>

              {/* Floating Pill Accent 3: Push (Purple Themed) */}
              <div className="absolute top-1/2 -right-4 sm:-right-7 z-20 hidden md:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-purple-200 text-purple-800 text-xs font-bold shadow-lg shadow-purple-900/5">
                <div className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center text-purple-600">
                  <BellRing className="w-3.5 h-3.5" />
                </div>
                <span>লাইভ নোটিফিকেশন</span>
              </div>

              {/* Smartphone Frame Outer Shell */}
              <div className="relative w-[270px] sm:w-[290px] h-[530px] sm:h-[570px] bg-slate-900 rounded-[44px] p-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-4 border-slate-700/70 ring-1 ring-slate-900/20 select-none">
                
                {/* Smartphone Screen (Clean Light & Emerald Hybrid App UI) */}
                <div className="w-full h-full bg-gradient-to-b from-[#FFFFFF] via-[#F6FBF7] to-[#EAF6ED] rounded-[36px] overflow-hidden flex flex-col justify-between relative border border-emerald-950/10">
                  
                  {/* Dynamic Island / Status Bar */}
                  <div className="pt-2 px-6 flex justify-between items-center text-[10px] text-slate-800 font-semibold z-20">
                    <span className="font-bold tracking-tight">09:41</span>
                    <div className="w-18 h-3.5 bg-black rounded-full flex items-center justify-end px-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <div className="w-3.5 h-2 border border-slate-700 rounded-2xs p-0.5">
                        <div className="w-full h-full bg-slate-800 rounded-3xs" />
                      </div>
                    </div>
                  </div>

                  {/* App Screen Content */}
                  <div className="px-4 py-3 flex-1 flex flex-col justify-between relative z-10 text-center">
                    
                    {/* Top Organization Brand Card with Official Uploaded Logo */}
                    <div className="pt-1">
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-2">
                        <img 
                          src="/logo-app.jpg" 
                          alt="সময়ের বাতিঘর" 
                          className="w-full h-full object-contain rounded-2xl shadow-md border border-slate-200 bg-white p-1"
                          onError={(e) => {
                            // Graceful fallback to round logo
                            (e.target as HTMLImageElement).src = '/logo-round.png';
                          }}
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0B6B3A] border-2 border-white flex items-center justify-center text-white shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      </div>
                      
                      <h4 className="font-heading font-black text-[#14231B] text-base sm:text-lg leading-tight">
                        সময়ের বাতিঘর
                      </h4>
                      <p className="text-[11px] text-[#0B6B3A] font-bold tracking-wide mt-0.5">
                        একতাই শক্তি, সেবাই ধর্ম
                      </p>

                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[10px] text-[#0B6B3A] border border-[#C8E6C9] font-semibold">
                        <ShieldCheck className="w-3 h-3 text-[#0B6B3A]" />
                        <span>অফিসিয়াল মোবাইল অ্যাপ্লিকেশন</span>
                      </div>
                    </div>

                    {/* Mini App UI Feature Cards with Distinct Colors */}
                    <div className="space-y-2 py-1">
                      {/* Card 1: Emergency Blood (Rose) */}
                      <div className="p-2.5 rounded-xl bg-white border border-rose-100 shadow-2xs flex items-center justify-between text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                            <Droplet className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">জরুরি রক্তদাতা খুঁজুন</span>
                        </div>
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">সক্রিয়</span>
                      </div>

                      {/* Card 2: Member Services (Indigo/Blue) */}
                      <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-between text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">সদস্য ড্যাশবোর্ড ও নোটিস</span>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">আপডেট</span>
                      </div>

                      {/* Card 3: Dues & Finance (Emerald) */}
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs flex items-center justify-between text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#0B6B3A] flex items-center justify-center">
                            <HeartHandshake className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">চাঁদা ও অনলাইন অনুদান</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">সুরক্ষিত</span>
                      </div>
                    </div>

                    {/* Bottom Phone Action Button (Direct Trigger on Mockup) */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleInstallClick}
                        className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#0B6B3A] to-[#0A5C34] hover:from-[#09572F] hover:to-[#084A2A] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 border border-[#C8E6C9]/40 cursor-pointer"
                      >
                        <Download className="w-4 h-4 animate-bounce" />
                        <span>{language === 'bn' ? 'সরাসরি ইনস্টল করুন' : 'Direct Install App'}</span>
                      </button>
                      <p className="text-[9.5px] text-slate-500 mt-1 font-medium">
                        Android • iOS • Windows এ সাপোর্ট করে
                      </p>
                    </div>

                  </div>

                  {/* Phone Home Bar at bottom */}
                  <div className="pb-1.5 flex justify-center">
                    <div className="w-24 h-1 bg-slate-400 rounded-full" />
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
                src="/logo-app.jpg" 
                alt="বাতিঘর" 
                className="w-12 h-12 rounded-xl border border-white/80 bg-white p-0.5 object-contain" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-round.png';
                }}
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
