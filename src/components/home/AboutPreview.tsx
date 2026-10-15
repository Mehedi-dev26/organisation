import { 
  HeartHandshake, 
  GraduationCap, 
  Syringe, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Users2,
  Sprout 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AboutPreview = () => {
  const { language } = useLanguage();

  const { data: aboutSettings, isLoading } = useQuery({
    queryKey: ['site-settings-about'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'about_section')
        .single();
      if (error || !data) return null;
      return data.value;
    },
  });

  const title = (aboutSettings && (language === 'bn' ? aboutSettings.title_bn : aboutSettings.title_en))
    || (language === 'bn' ? 'আমাদের সম্পর্কে ও সাংগঠনিক পরিচয়' : 'About Us & Organizational Profile');

  const description = (aboutSettings && (language === 'bn' ? aboutSettings.description_bn : aboutSettings.description_en))
    || (language === 'bn'
        ? 'সমাজের পিছিয়ে পড়া অসহায় মানুষের কল্যাণে, জরুরি রক্তদান ও সামাজিক উন্নয়নে নিবেদিত একটি স্বেচ্ছাসেবী পরিবার।'
        : 'A dedicated volunteer family committed to the welfare of underprivileged people, emergency blood donation, and social development.');

  const missionText = (aboutSettings && (language === 'bn' ? aboutSettings.mission_bn : aboutSettings.mission_en))
    || (language === 'bn' ? 'একতাই শক্তি, সেবাই ধর্ম — মানবতার সেবায় সর্বদা অঙ্গীকারবদ্ধ' : 'Unity is Strength, Service is Religion');

  const imageMain = aboutSettings?.image_main || '/images/about1.jpg';
  const imageSecondary = aboutSettings?.image_secondary || '/images/about2.jpg';
  const statsBadge = typeof aboutSettings?.stats === 'string' 
    ? aboutSettings.stats 
    : (language === 'bn' ? '৫+ বছর' : '5+ Years');

  const keyPoints = [
    {
      icon: Syringe,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      titleBn: 'জরুরি চিকিৎসা ও রক্তদান',
      titleEn: 'Emergency Healthcare & Blood',
      descBn: 'অসহায় রোগীদের অপারেশন সহায়তা এবং ২৪ ঘণ্টা জরুরি রক্তদানের সমন্বয়।',
      descEn: 'Medical aid for vulnerable patients and 24/7 volunteer blood donors.',
    },
    {
      icon: GraduationCap,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
      titleBn: 'শিক্ষা বিস্তার ও শিক্ষাবৃত্তি',
      titleEn: 'Education & Scholarships',
      descBn: 'মেধাবী ও অসচ্ছল শিক্ষার্থীদের শিক্ষা উপকরণ বিতরণ ও মাসিক বৃত্তি সহায়তা।',
      descEn: 'Educational supplies and monthly scholarship support for bright students.',
    },
    {
      icon: HeartHandshake,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      titleBn: 'পরিবার পুনর্বাসন ও সহায়তা',
      titleEn: 'Community Rehabilitation',
      descBn: 'শীতবস্ত্র বিতরণ, দুর্যোগকালীন ত্রাণ এবং অসহায় পরিবারকে স্বাবলম্বীকরণ।',
      descEn: 'Winter clothes, disaster relief distribution and livelihood support.',
    },
    {
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      titleBn: 'শতভাগ স্বচ্ছতা ও জবাবদিহিতা',
      titleEn: '100% Transparency',
      descBn: 'সদস্য চাঁদা ও তহবিলের প্রতিটি টাকার সম্পূর্ণ উন্মুক্ত ডিজিটাল হিসাব নিকাশ।',
      descEn: 'Open digital ledger and verified audit for every contribution.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* Centered Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          {/* Top Pill Badge */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] shadow-xs">
              <span className="w-5 h-5 rounded-full bg-[#0B6B3A] flex items-center justify-center text-white flex-shrink-0">
                <Sprout className="w-3.5 h-3.5" />
              </span>
              <span className="text-[#0B6B3A] text-xs sm:text-sm font-semibold tracking-wide">
                {language === 'bn' ? 'মানবতার কল্যাণে আমরা নিবেদিত' : 'Dedicated to Humanity'}
              </span>
            </div>
          </div>
          
          {/* Main Heading with Organic Leaf Strokes & Hand-Painted Underline */}
          <div className="inline-flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap mb-3.5">
            {/* Left Leaf Sparkle Strokes */}
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

            {/* Title */}
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              <span className="text-[#14231B] dark:text-slate-100">
                {language === 'bn' ? 'আমাদের ' : 'About '}
              </span>
              <span className="text-[#0B6B3A] relative inline-block">
                {language === 'bn' ? 'সংগঠন ও পরিচিতি' : 'Our Organization'}
                {/* Yellow-Green Hand-Painted Brush Stroke Underline */}
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

            {/* Right Leaf Sparkle Strokes (Mirrored) */}
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

          <p className="mt-1 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Multi-Image Mosaic */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Primary Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-[4/3] group bg-slate-100">
                {isLoading ? (
                  <div className="w-full h-full bg-slate-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                  </div>
                ) : (
                  <img
                    src={imageMain}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                    <Users2 className="w-4 h-4" />
                    <span>{language === 'bn' ? 'ঐক্যবদ্ধ স্বেচ্ছাসেবক টিম' : 'United Volunteers'}</span>
                  </p>
                  <h4 className="text-sm sm:text-base font-bold drop-shadow">
                    {language === 'bn' ? 'মানবতার কল্যাণে আমরা সদাপ্রস্তুত' : 'Standing Together for Humanity'}
                  </h4>
                </div>
              </div>

              {/* Overlapping Secondary Image (Offset Bottom-Right) */}
              <div className="absolute -bottom-8 -right-4 sm:-right-8 w-48 sm:w-60 md:w-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-square z-20 group bg-slate-100">
                {isLoading ? (
                  <div className="w-full h-full bg-slate-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                  </div>
                ) : (
                  <img
                    src={imageSecondary}
                    alt="কার্যক্রম"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[11px] font-bold">
                  <span>{language === 'bn' ? 'শিক্ষা ও মানবিক সহায়তা' : 'Aid & Welfare'}</span>
                </div>
              </div>

              {/* Floating Experience & Trust Badge */}
              <div className="absolute -top-5 -left-3 sm:-left-6 z-20 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3 sm:p-4 rounded-2xl shadow-xl border-2 border-white/30 backdrop-blur-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black leading-none text-white">
                    {statsBadge}
                  </div>
                  <div className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-0.5">
                    {language === 'bn' ? 'মানবসেবায় অবিচল' : 'Dedicated Service'}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: About Us Content & Pillars */}
          <div className="lg:col-span-6 space-y-6">
            {/* Mission Statement Sub-heading */}
            <h3 className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-[1.25]">
              {missionText}
            </h3>

            {/* Paragraph Description */}
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {description}
            </p>

            {/* 4 Feature Key Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {keyPoints.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 flex items-start gap-3 group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {language === 'bn' ? item.titleBn : item.titleEn}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">
                      {language === 'bn' ? item.descBn : item.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bullet Summary Checklist */}
            <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-foreground/90">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'নিবন্ধিত স্বেচ্ছাসেবী সংগঠন' : 'Registered Welfare Body'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'সরাসরি তৃণমূল পর্যায়ে সেবা' : 'Grassroots Human Aid'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'অনলাইন সদস্য ও চাঁদা ব্যবস্থা' : 'Online Dues Portal'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
              <Button 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 text-sm h-11"
                asChild
              >
                <Link to="/about">
                  <span>{language === 'bn' ? 'আমাদের বিস্তারিত জানুন' : 'Learn More'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              <Button 
                variant="outline" 
                size="lg" 
                className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold text-sm h-11"
                asChild
              >
                <Link to="/member-registration">
                  <span>{language === 'bn' ? 'সদস্য হিসেবে যুক্ত হন' : 'Become a Member'}</span>
                </Link>
              </Button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutPreview;
