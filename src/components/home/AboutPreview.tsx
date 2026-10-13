import { 
  HeartHandshake, 
  GraduationCap, 
  Syringe, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Users2 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutPreview = () => {
  const { language } = useLanguage();

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
        {/* Centered Section Header (Matching Executive Committee style & reference alignment) */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-bold border border-emerald-200 dark:border-emerald-800 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>{language === 'bn' ? 'সাংগঠনিক পরিচিতি' : 'Organizational Profile'}</span>
          </div>
          
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            {language === 'bn' ? 'আমাদের সম্পর্কে ও সাংগঠনিক পরিচয়' : 'About Us & Organizational Profile'}
          </h2>

          <p className="mt-3.5 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {language === 'bn' 
              ? 'সমাজের পিছিয়ে পড়া অসহায় মানুষের কল্যাণে, জরুরি রক্তদান ও সামাজিক উন্নয়নে নিবেদিত একটি স্বেচ্ছাসেবী পরিবার।'
              : 'A dedicated volunteer family committed to the welfare of underprivileged people, emergency blood donation, and social development.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Multi-Image Mosaic / Collage (Inspired by Helpline Hello Naogaon style) */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Primary Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-[4/3] group">
                <img
                  src="/images/about1.jpg"
                  alt="সময়ের বাতিঘর স্বেচ্ছাসেবকবৃন্দ"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
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
              <div className="absolute -bottom-8 -right-4 sm:-right-8 w-48 sm:w-60 md:w-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-square z-20 group">
                <img
                  src="/images/about2.jpg"
                  alt="শিক্ষা সহায়তা কার্যক্রম"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[11px] font-bold">
                  <span>{language === 'bn' ? 'শিক্ষা উপকরণ বিতরণ' : 'Educational Aid'}</span>
                </div>
              </div>

              {/* Floating Experience & Trust Badge */}
              <div className="absolute -top-5 -left-3 sm:-left-6 z-20 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3 sm:p-4 rounded-2xl shadow-xl border-2 border-white/30 backdrop-blur-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black leading-none text-white">
                    {language === 'bn' ? '৫+ বছর' : '5+ Years'}
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
              {language === 'bn' 
                ? 'একতাই শক্তি, সেবাই ধর্ম — মানবতার সেবায় সর্বদা অঙ্গীকারবদ্ধ' 
                : 'Unity is Strength, Service is Religion'}
            </h3>

            {/* Paragraph Description */}
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {language === 'bn'
                ? '“সময়ের বাতিঘর” একটি অরাজনৈতিক, অলাভজনক ও সামাজিক স্বেচ্ছাসেবী কল্যাণমূলক সংগঠন। সমাজের পিছিয়ে পড়া অসহায় মানুষদের পাশে দাঁড়ানো, জরুরি চিকিৎসায় রক্তদানের ব্যবস্থা করা এবং অসচ্ছল শিক্ষার্থীদের সহায়তার মহান ব্রত নিয়ে একদল নিবেদিত তরুণদের উদ্যোগে আমাদের এই পথচলা।'
                : '“Samoyer Batighor” is a non-profit, non-political community welfare organization dedicated to standing by underprivileged people, providing emergency blood donation support, and empowering children through educational aid.'}
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
