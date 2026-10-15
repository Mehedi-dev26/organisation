import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { 
  Eye, 
  Target, 
  Heart, 
  Users, 
  ShieldCheck, 
  Clock, 
  Sprout, 
  ArrowRight 
} from 'lucide-react';

// Use the local assets copied from user reference
import historyPhoto from '@/assets/about/about-history.jpg';
import heroBgPhoto from '@/assets/about/about-hero-bg.png';

const About = () => {
  const { language } = useLanguage();

  const valuesData = [
    {
      id: 'service',
      titleBn: 'সেবা',
      titleEn: 'Service',
      descBn: 'বঞ্চিত মানুষের পাশে থাকা আমাদের অঙ্গীকার।',
      descEn: 'Commitment to stand by underprivileged people.',
      icon: Heart,
      iconBg: 'bg-[#107A48]',
      color: '#107A48',
    },
    {
      id: 'unity',
      titleBn: 'ঐক্য',
      titleEn: 'Unity',
      descBn: 'একতাবদ্ধ হয়ে কাজ করা আমাদের শক্তি।',
      descEn: 'Working unitedly is our greatest strength.',
      icon: Users,
      iconBg: 'bg-[#2563EB]',
      color: '#2563EB',
    },
    {
      id: 'integrity',
      titleBn: 'সততা',
      titleEn: 'Integrity',
      descBn: 'সততা ও নীতিতে অটল থাকা।',
      descEn: 'Uncompromising honesty and ethical values.',
      icon: ShieldCheck,
      iconBg: 'bg-[#D97706]',
      color: '#D97706',
    },
    {
      id: 'dedication',
      titleBn: 'নিষ্ঠা',
      titleEn: 'Dedication',
      descBn: 'মানুষের আস্থার যোগ্য হওয়া।',
      descEn: 'Earning and maintaining people’s trust.',
      icon: Clock,
      iconBg: 'bg-[#8A3FD1]',
      color: '#8A3FD1',
    },
    {
      id: 'sustainability',
      titleBn: 'টেকসই উন্নয়ন',
      titleEn: 'Sustainability',
      descBn: 'দীর্ঘমেয়াদি পরিবর্তনের জন্য কাজ করা।',
      descEn: 'Working for lasting positive change.',
      icon: Sprout,
      iconBg: 'bg-[#0D9488]',
      color: '#0D9488',
    },
  ];

  return (
    <MainLayout>
      {/* =========================================================================
          SECTION A: HERO SECTION WITH LIGHT NATURAL TEXTURE & PROMINENT VIEW
          ========================================================================= */}
      <section 
        className="relative pt-24 pb-32 sm:pt-28 sm:pb-36 md:pt-36 md:pb-44 text-center overflow-hidden"
        style={{
          background: `linear-gradient(180deg, rgba(8, 52, 28, 0.45) 0%, rgba(11, 107, 58, 0.22) 40%, rgba(6, 42, 22, 0.58) 100%), url(${heroBgPhoto}) center/cover no-repeat`,
        }}
      >
        {/* Floating Green Leaves (Left) */}
        <div className="absolute top-10 left-4 md:left-12 w-14 sm:w-18 pointer-events-none opacity-85 select-none drop-shadow">
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-lime-400">
            <path d="M10 38C10 38 12 18 38 10C38 10 38 30 18 38C15 39 10 38 10 38Z" fill="currentColor" opacity="0.9" />
            <path d="M10 38C20 28 30 20 38 10" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Floating Green Leaves (Right) */}
        <div className="absolute top-8 right-6 md:right-28 w-12 sm:w-16 pointer-events-none opacity-80 select-none drop-shadow">
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-emerald-300 rotate-45">
            <path d="M10 38C10 38 12 18 38 10C38 10 38 30 18 38C15 39 10 38 10 38Z" fill="currentColor" opacity="0.85" />
          </svg>
        </div>

        {/* Luminous Lighthouse Line-Art Illustration (Right Side) */}
        <div className="hidden md:block absolute right-6 lg:right-16 top-1/2 -translate-y-1/2 pointer-events-none z-10 select-none">
          <div className="relative w-28 sm:w-32 lg:w-36 h-36 sm:h-40 flex items-center justify-center">
            <svg 
              viewBox="0 0 100 130" 
              fill="none" 
              className="w-full h-full text-white/95 drop-shadow-[0_0_18px_rgba(255,255,255,0.6)]"
            >
              {/* Radiating Light Rays */}
              <line x1="50" y1="32" x2="10" y2="10" stroke="#FDE047" strokeWidth="2.2" strokeDasharray="3 3" opacity="0.95" />
              <line x1="50" y1="32" x2="0" y2="32" stroke="#FDE047" strokeWidth="2.2" strokeDasharray="3 3" opacity="0.95" />
              <line x1="50" y1="32" x2="10" y2="55" stroke="#FDE047" strokeWidth="2.2" strokeDasharray="3 3" opacity="0.95" />
              <line x1="50" y1="32" x2="90" y2="10" stroke="#FDE047" strokeWidth="2.2" strokeDasharray="3 3" opacity="0.95" />
              <line x1="50" y1="32" x2="100" y2="32" stroke="#FDE047" strokeWidth="2.2" strokeDasharray="3 3" opacity="0.95" />
              <line x1="50" y1="32" x2="90" y2="55" stroke="#FDE047" strokeWidth="2.2" strokeDasharray="3 3" opacity="0.95" />

              {/* Lighthouse Dome / Top Lantern */}
              <path d="M42 20 Q50 10 58 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="40" y="20" width="20" height="15" rx="2" fill="rgba(253, 224, 71, 0.45)" stroke="white" strokeWidth="2" />
              <line x1="50" y1="20" x2="50" y2="35" stroke="white" strokeWidth="1.5" />

              {/* Balcony Railing */}
              <line x1="36" y1="35" x2="64" y2="35" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

              {/* Tapered Tower Body */}
              <path d="M41 35 L35 95 H65 L59 35 Z" fill="rgba(255, 255, 255, 0.18)" stroke="white" strokeWidth="2.5" />
              
              {/* Horizontal Stripes */}
              <line x1="38" y1="55" x2="62" y2="55" stroke="white" strokeWidth="2" />
              <line x1="36.5" y1="75" x2="63.5" y2="75" stroke="white" strokeWidth="2" />

              {/* Central Windows */}
              <rect x="47" y="44" width="6" height="7" rx="1.5" fill="white" />
              <rect x="47" y="64" width="6" height="7" rx="1.5" fill="white" />

              {/* Foundation / Base */}
              <rect x="30" y="95" width="40" height="15" rx="3" fill="rgba(255, 255, 255, 0.3)" stroke="white" strokeWidth="2.5" />
              <line x1="24" y1="110" x2="76" y2="110" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
          {/* Top Tagline Badge */}
          <div className="inline-flex items-center gap-2 text-white/95 text-xs sm:text-sm font-semibold tracking-wide mb-3 sm:mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            <span>— মানুষের পাশে,</span>
            <span className="text-[#FACC15]">🌾</span>
            <span>সমাজের সাথে —</span>
          </div>

          {/* Main Title: আমাদের (white) সম্পর্কে (golden-yellow) */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]">
            <span className="text-white">
              {language === 'bn' ? 'আমাদের ' : 'About '}
            </span>
            <span className="text-[#FACC15]">
              {language === 'bn' ? 'সম্পর্কে' : 'Us'}
            </span>
          </h1>

          {/* Arched Golden Curved Underline matching reference screenshot */}
          <div className="flex justify-center mb-4">
            <svg 
              className="w-52 sm:w-64 md:w-80 h-4 sm:h-5 text-[#FACC15] pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" 
              viewBox="0 0 240 18" 
              fill="none"
              preserveAspectRatio="none"
            >
              <path 
                d="M4 15C70 3 170 3 236 15" 
                stroke="currentColor" 
                strokeWidth="3.2" 
                strokeLinecap="round" 
              />
            </svg>
          </div>

          {/* Supporting Subtitle */}
          <p className="text-white text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {language === 'bn'
              ? 'আমাদের সংগঠনের ইতিহাস, লক্ষ্য এবং প্রধানদের সম্পর্কে জানুন'
              : 'Learn about our organization’s history, mission, and leadership'}
          </p>
        </div>

        {/* Bottom Double-Layered Wave Transition (Ribbon + White) */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none z-10 pointer-events-none">
          {/* Layer 1: Semi-translucent dark green wave ribbon */}
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="relative block w-full h-10 sm:h-14 md:h-16 text-[#0B6B3A]/70 fill-current -mb-8 sm:-mb-10"
          >
            <path d="M0,35 C200,90 450,15 700,55 C950,95 1100,25 1200,45 L1200,120 L0,120 Z" />
          </svg>
          {/* Layer 2: Solid white wave */}
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="relative block w-full h-10 sm:h-14 md:h-16 text-white fill-current"
          >
            <path d="M0,45 C250,105 500,20 750,65 C1000,110 1100,35 1200,55 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* =========================================================================
          SECTION B: MISSION & VISION CARDS (আমাদের লক্ষ্য & আমাদের দৃষ্টিভঙ্গি)
          ========================================================================= */}
      <section className="relative py-14 sm:py-18 lg:py-20 bg-white overflow-hidden">
        {/* Subtle Decorative Floating Foliage on Background */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-28 sm:w-36 pointer-events-none select-none opacity-40">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-emerald-600">
            <path d="M10 80C20 40 50 20 90 10C70 50 50 80 10 80Z" fill="currentColor" opacity="0.15" />
          </svg>
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-28 sm:w-36 pointer-events-none select-none opacity-40">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-emerald-600 -scale-x-100">
            <path d="M10 80C20 40 50 20 90 10C70 50 50 80 10 80Z" fill="currentColor" opacity="0.15" />
          </svg>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            
            {/* Card 1: আমাদের লক্ষ্য (Our Mission) */}
            <div className="bg-white rounded-[26px] border border-slate-200/90 p-7 sm:p-9 shadow-[0_10px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between group hover:-translate-y-1">
              <div>
                {/* Organic Green Blob with Eye Icon */}
                <div className="w-14 h-14 rounded-[18px] bg-[#0B6B3A] text-white flex items-center justify-center shadow-sm mb-6 group-hover:scale-105 transition-transform duration-300">
                  <Eye className="w-7 h-7 stroke-[2.2]" />
                </div>

                {/* Heading */}
                <h2 className="text-2xl sm:text-[26px] font-bold font-heading text-[#14231B] mb-3.5 tracking-tight group-hover:text-[#0B6B3A] transition-colors">
                  {language === 'bn' ? 'আমাদের লক্ষ্য' : 'Our Mission'}
                </h2>

                {/* Paragraph */}
                <p className="text-[#4B5E53] text-sm sm:text-[15px] leading-relaxed mb-6 font-normal">
                  {language === 'bn'
                    ? 'সমাজের সুবিধাবঞ্চিত মানুষদের পাশে দাঁড়ানো এবং তাদের জীবনমান উন্নয়নের জন্য কাজ করে, স্বাস্থ্য, শিক্ষা, এবং সামাজিক উন্নয়নের মাধ্যমে একটি সুন্দর সমাজ গড়ে তোলা আমাদের মূল লক্ষ্য।'
                    : 'To stand beside underprivileged people, improving quality of life through healthcare, education, and social development.'}
                </p>
              </div>

              {/* Bottom Row: Pill Button on Left, Leaf Accent on Right */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  to="/programs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EAF6ED] text-[#0B6B3A] border border-[#C8E6C9] font-semibold text-xs sm:text-sm hover:bg-[#d5eed9] transition-all"
                >
                  <span>{language === 'bn' ? 'বিস্তারিত জানুন' : 'Learn More'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                </Link>

                {/* Corner Leaf Accent Motif */}
                <div className="pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity">
                  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 text-[#0B6B3A]">
                    <path d="M6 26C8 16 16 8 28 4C26 14 18 24 6 26Z" fill="currentColor" />
                    <path d="M12 28C16 20 22 14 30 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 2: আমাদের দৃষ্টিভঙ্গি (Our Vision) */}
            <div className="bg-white rounded-[26px] border border-slate-200/90 border-l-4 border-l-[#D97706] p-7 sm:p-9 shadow-[0_10px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between group hover:-translate-y-1">
              <div>
                {/* Organic Amber Blob with Target Icon */}
                <div className="w-14 h-14 rounded-[18px] bg-[#D97706] text-white flex items-center justify-center shadow-sm mb-6 group-hover:scale-105 transition-transform duration-300">
                  <Target className="w-7 h-7 stroke-[2.2]" />
                </div>

                {/* Heading */}
                <h2 className="text-2xl sm:text-[26px] font-bold font-heading text-[#14231B] mb-3.5 tracking-tight group-hover:text-[#D97706] transition-colors">
                  {language === 'bn' ? 'আমাদের দৃষ্টিভঙ্গি' : 'Our Vision'}
                </h2>

                {/* Paragraph */}
                <p className="text-[#4B5E53] text-sm sm:text-[15px] leading-relaxed mb-6 font-normal">
                  {language === 'bn'
                    ? 'একটি সুন্দর, সমতাভিত্তিক ও সমৃদ্ধ সমাজ গঠন যেখানে প্রতিটি মানুষ সম্মান ও মানবিকতার সাথে জীবনযাপন করবে — সেটাই আমাদের দৃষ্টিভঙ্গি। আমরা বিশ্বাস করি, পরিবর্তন শুরু হয় মানুষের পাশে দাঁড়ানো থেকে।'
                    : 'Building an equitable, thriving society where every human lives with dignity and compassion — that is our vision.'}
                </p>
              </div>

              {/* Bottom Row: Pill Button on Left, Amber Leaf Accent on Right */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  to="/programs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFF6E5] text-[#D97706] border border-[#FDE68A] font-semibold text-xs sm:text-sm hover:bg-[#ffedcc] transition-all"
                >
                  <span>{language === 'bn' ? 'বিস্তারিত জানুন' : 'Learn More'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                </Link>

                {/* Corner Leaf Accent Motif in Amber */}
                <div className="pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity">
                  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 text-[#D97706]">
                    <path d="M6 26C8 16 16 8 28 4C26 14 18 24 6 26Z" fill="currentColor" />
                    <path d="M12 28C16 20 22 14 30 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION C: OUR VALUES (আমাদের মূল্যবোধ) — 5 RESTRAINED ROUNDED CARDS
          ========================================================================= */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-[#EDF5EF]/85 border-y border-emerald-950/5 overflow-hidden">
        {/* Gentle Top Wave Divider */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none z-0 pointer-events-none">
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-8 sm:h-10 text-white fill-current">
            <path d="M0,0 C300,50 900,10 1200,40 L1200,0 L0,0 Z" />
          </svg>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            {/* Top Pill Badge: 🌿 ← আমাদের শক্তি → */}
            <div className="flex justify-center mb-3.5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] shadow-xs">
                <span className="text-[#0B6B3A]">🌿</span>
                <span className="text-[#0B6B3A] text-xs sm:text-sm font-bold tracking-wide">
                  {language === 'bn' ? '← আমাদের শক্তি →' : '← Our Strength →'}
                </span>
              </div>
            </div>

            {/* Heading */}
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B6B3A] tracking-tight leading-tight mb-3">
              {language === 'bn' ? 'আমাদের মূল্যবোধ' : 'Our Values'}
            </h2>

            {/* Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              {language === 'bn'
                ? 'আমরা বিশ্বাস করি, সৎ মূল্যবোধই একটি শক্তিশালী ও টেকসই সমাজ গঠনের ভিত্তি।'
                : 'We believe genuine values form the bedrock of a resilient and sustainable society.'}
            </p>
          </div>

          {/* 5 Value Cards in an Even Row on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
            {valuesData.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.id}
                  className="bg-white rounded-[22px] p-5 sm:p-6 text-center border border-slate-200/80 shadow-[0_6px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden flex flex-col items-center justify-between min-h-[195px] group"
                >
                  <div className="flex flex-col items-center w-full">
                    {/* Icon Container Blob */}
                    <div 
                      className={`w-13 h-13 sm:w-14 sm:h-14 rounded-[18px] ${val.iconBg} text-white flex items-center justify-center shadow-xs mb-4 group-hover:scale-105 transition-transform duration-300`}
                    >
                      <Icon className="w-6.5 h-6.5 stroke-[2.2]" />
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#14231B] mb-1.5 group-hover:text-[#0B6B3A] transition-colors">
                      {language === 'bn' ? val.titleBn : val.titleEn}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-snug">
                      {language === 'bn' ? val.descBn : val.descEn}
                    </p>
                  </div>

                  {/* Clean Bottom Accent Line in Value's Distinct Color */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-[22px] pointer-events-none transition-all duration-300 group-hover:h-2"
                    style={{ backgroundColor: val.color }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION D: OUR HISTORY (আমাদের ইতিহাস) — SEAMLESS LANDSCAPE BLEND
          ========================================================================= */}
      <section className="relative py-20 sm:py-24 lg:py-28 bg-gradient-to-r from-emerald-50/25 via-white to-emerald-50/30 overflow-hidden">
        {/* Landscape Image integrated on the left with soft organic fade into background */}
        <div className="absolute top-0 bottom-0 left-0 w-full lg:w-[50%] pointer-events-none select-none z-0 overflow-hidden">
          <img 
            src={historyPhoto} 
            alt="" 
            className="w-full h-full object-cover object-left opacity-90 transition-transform duration-700 hover:scale-105"
            style={{
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 55%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 55%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0) 100%)',
            }}
          />
          {/* Subtle misty watercolor overlays blending naturally */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white/95 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Floating Green Leaves (Top Right of History Section) */}
        <div className="absolute top-8 right-6 sm:right-12 w-12 sm:w-16 pointer-events-none opacity-80 select-none z-10">
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-emerald-600">
            <path d="M10 38C10 38 12 18 38 10C38 10 38 30 18 38C15 39 10 38 10 38Z" fill="currentColor" opacity="0.8" />
            <path d="M10 38C20 28 30 20 38 10" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Left Column Spacer so the landscape visually lives on the left */}
            <div className="lg:col-span-5 hidden lg:block min-h-[300px]" />

            {/* Right Column: Heading, Story & Action Button */}
            <div className="lg:col-span-7 flex flex-col items-start bg-white/80 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none p-6 sm:p-8 lg:p-0 rounded-3xl">
              {/* Header with Organic Leaf Accent */}
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <span className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#0B6B3A] flex-shrink-0 shadow-2xs">
                  <Sprout className="w-5.5 h-5.5 text-[#0B6B3A]" />
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#14231B] tracking-tight leading-tight">
                  {language === 'bn' ? 'আমাদের ইতিহাস' : 'Our History'}
                </h2>
              </div>

              {/* Story Narrative */}
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-7 font-normal">
                {language === 'bn'
                  ? 'সময়ের বাতিঘর ২০২৩ সালে প্রতিষ্ঠিত হয়। একজন সমাজসেবী মানুষের হাতে ধরে শুরু হয় এই সংগঠন। শুরু থেকেই আমাদের প্রধান লক্ষ্য ছিলো সাপাহার এলাকার পিছিয়ে পড়া মানুষদের পাশে দাঁড়ানো, শিক্ষা, স্বাস্থ্য, এবং সামাজিক উন্নয়নের মাধ্যমে একটি সুন্দর সমাজ গঠন করা।'
                  : 'Samoyer Batighor was founded in 2023 through the vision of dedicated humanitarian leaders. From the very beginning, our prime focus has been to stand beside underprivileged communities in Sapahar, uplifting lives through education, healthcare, and progressive social development.'}
              </p>

              {/* Action Button: আরও জানতে চাই → */}
              <Link
                to="/contact"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#0B6B3A] text-white font-bold text-sm sm:text-base hover:bg-[#08522c] shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <span>{language === 'bn' ? 'আরও জানতে চাই' : 'Learn More'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>

          </div>
        </div>

        {/* Bottom Organic Dark Green Wave transitioning smoothly into Footer */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none z-10 pointer-events-none">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="relative block w-full h-8 sm:h-12 md:h-14 text-[#0B6B3A] fill-current">
            <path d="M0,40 C300,85 700,10 1200,55 L1200,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* =========================================================================
          SECTION E: CLEAN TRANSITION TO EXISTING FOOTER
          (Footer is seamlessly rendered by MainLayout with no duplication)
          ========================================================================= */}
    </MainLayout>
  );
};

export default About;
