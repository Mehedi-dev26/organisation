import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  HeartHandshake, 
  Sparkles,
  Droplet,
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BannerSlide {
  id: string;
  image: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  tagBn: string;
  tagEn: string;
}

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: 'default-1',
    image: '/images/banner1.jpg',
    tagBn: 'মানবসেবায় নিবেদিত সামাজিক সংগঠন',
    tagEn: 'Non-profit Social Welfare Organization',
    titleBn: 'একতাই শক্তি, সেবাই ধর্ম — মানবতার সেবায় নিবেদিত',
    titleEn: 'Unity is Strength, Service is Religion',
    subtitleBn: 'সমাজের পিছিয়ে পড়া মানুষের পাশে দাঁড়ানো, অসহায়দের মুখে হাসি ফোটানো এবং একটি আত্মনির্ভর সমাজ গড়ার অঙ্গীকার।',
    subtitleEn: 'Dedicated to empowering the underprivileged and standing by vulnerable families across the community.',
  },
  {
    id: 'default-2',
    image: '/images/banner2.jpg',
    tagBn: '২৪ ঘণ্টা জরুরি স্বাস্থ্য ও রক্তদান সহায়তা',
    tagEn: '24/7 Emergency Blood & Healthcare Aid',
    titleBn: 'জরুরি রক্তদান ও বিনামূল্যে চিকিৎসা সহায়তা কার্যক্রম',
    titleEn: 'Emergency Blood Donation & Free Health Camps',
    subtitleBn: 'মুমূর্ষু রোগীর রক্তের প্রয়োজনে কিংবা চিকিৎসায় সহায়তা দিতে আমাদের স্বেচ্ছাসেবক দল সদাপ্রস্তুত।',
    subtitleEn: 'Our volunteer network is always ready to assist patients with blood donation and medical support.',
  },
];

const HeroSection = () => {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Fetch dynamic banners from Supabase database if uploaded by Admin
  const { data: dbBanners } = useQuery({
    queryKey: ['hero-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('category', 'banner')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return null;
      }

      return data.map((item): BannerSlide => ({
        id: item.id,
        image: item.image_url,
        tagBn: item.title_bn || 'জনকল্যাণমূলক সামাজিক উদ্যোগ',
        tagEn: item.title_en || 'Community Welfare Initiative',
        titleBn: item.title_bn || 'সময়ের বাতিঘর — একতাই শক্তি',
        titleEn: item.title_en || 'Samoyer Batighor',
        subtitleBn: item.description_bn || 'মানবসেবায় নিবেদিত একদল স্বপ্নবাজ তরুণ ও সামাজিক নেতৃত্ব।',
        subtitleEn: item.description_en || 'Dedicated to social welfare and community empowerment.',
      }));
    },
  });

  const slides: BannerSlide[] = dbBanners && dbBanners.length > 0 ? dbBanners : DEFAULT_SLIDES;

  // Auto-play slide rotation
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section 
      className="relative w-full h-[520px] sm:h-[580px] md:h-[620px] lg:h-[660px] overflow-hidden bg-slate-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (diff > 50) handleNext();
        else if (diff < -50) handlePrev();
        touchStartX.current = null;
      }}
    >
      {/* Slides Rendering */}
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image - Clean and fully visible */}
            <div 
              className={`absolute inset-0 bg-cover bg-center transition-transform ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
              style={{ 
                backgroundImage: `url(${slide.image})`,
                transitionDuration: '7000ms'
              }}
            />

            {/* Subtle soft gradient sketch on the left for text legibility without blocking the image */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 bg-gradient-to-r from-black/50 via-transparent to-transparent pointer-events-none" />
            
            {/* Bottom gradient fade */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

            {/* Slide Text Content - No glass card, pure clean readable layout */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full flex items-center relative z-20">
              <div className="max-w-xl md:max-w-2xl text-left py-8 sm:py-12">
                
                {/* Floating Tag / Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/80 backdrop-blur-xs text-white text-xs sm:text-sm font-bold mb-3 sm:mb-4 shadow-sm border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'bn' ? slide.tagBn : slide.tagEn}</span>
                </div>

                {/* Main Heading with Crisp Shadow */}
                <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight sm:leading-[1.2] mb-3 sm:mb-4 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {language === 'bn' ? slide.titleBn : slide.titleEn}
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm md:text-base text-slate-100 max-w-xl leading-relaxed mb-6 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                  {language === 'bn' ? slide.subtitleBn : slide.subtitleEn}
                </p>

                {/* Unified Compact Aligned Buttons: সদস্য আবেদন, চাঁদা অনুদান, ইভেন্ট ও কার্যক্রম, রক্তদাতা */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
                  
                  {/* ১. সদস্য আবেদন করুন */}
                  <Button 
                    size="sm" 
                    className="h-9 px-3.5 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all hover:scale-105"
                    asChild
                  >
                    <Link to="/member-registration">
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      <span>{language === 'bn' ? 'সদস্য আবেদন' : 'Apply Member'}</span>
                    </Link>
                  </Button>

                  {/* ২. চাঁদা / অনুদান */}
                  <Button 
                    size="sm" 
                    className="h-9 px-3.5 sm:px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all hover:scale-105"
                    asChild
                  >
                    <Link to="/member/pay-dues">
                      <HeartHandshake className="w-3.5 h-3.5 mr-1.5" />
                      <span>{language === 'bn' ? 'চাঁদা / অনুদান' : 'Dues / Donate'}</span>
                    </Link>
                  </Button>

                  {/* ৩. ইভেন্ট ও কার্যক্রম */}
                  <Button 
                    size="sm" 
                    className="h-9 px-3.5 sm:px-4 bg-white/95 hover:bg-white text-slate-800 font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all hover:scale-105"
                    asChild
                  >
                    <Link to="/news">
                      <CalendarCheck className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                      <span>{language === 'bn' ? 'ইভেন্ট ও কার্যক্রম' : 'Events & News'}</span>
                    </Link>
                  </Button>

                  {/* ৪. জরুরি রক্তদাতা ডাটাবেস */}
                  <Button 
                    size="sm" 
                    className="h-9 px-3.5 sm:px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all hover:scale-105"
                    asChild
                  >
                    <Link to="/blood-donors">
                      <Droplet className="w-3.5 h-3.5 mr-1.5 fill-white" />
                      <span>{language === 'bn' ? 'রক্তদাতা ডাটাবেস' : 'Blood Donors'}</span>
                    </Link>
                  </Button>

                </div>

              </div>
            </div>
          </div>
        );
      })}

      {/* Slider Controls: Previous & Next Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-emerald-600 text-white backdrop-blur-xs border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-emerald-600 text-white backdrop-blur-xs border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/15">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentSlide
                ? 'w-7 sm:w-8 h-2 bg-emerald-400 shadow-xs'
                : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
