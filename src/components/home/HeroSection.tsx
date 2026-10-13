import { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  HeartHandshake, 
  PhoneCall, 
  ShieldCheck, 
  Sparkles 
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
  primaryLink: string;
  primaryTextBn: string;
  primaryTextEn: string;
  secondaryLink: string;
  secondaryTextBn: string;
  secondaryTextEn: string;
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
    primaryLink: '/member-registration',
    primaryTextBn: 'সদস্য আবেদন করুন',
    primaryTextEn: 'Join as a Member',
    secondaryLink: '/about',
    secondaryTextBn: 'আমাদের সম্পর্কে জানুন',
    secondaryTextEn: 'About Our Mission',
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
    primaryLink: '/blood-donors',
    primaryTextBn: 'রক্তদাতা খুঁজুন / রক্তদাতা হন',
    primaryTextEn: 'Find Blood Donor / Join',
    secondaryLink: '/events',
    secondaryTextBn: 'সেবামূলক কার্যক্রম দেখুন',
    secondaryTextEn: 'View Our Projects',
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

      return data.map((item, idx): BannerSlide => ({
        id: item.id,
        image: item.image_url,
        tagBn: item.title_bn || 'জনকল্যাণমূলক সামাজিক উদ্যোগ',
        tagEn: item.title_en || 'Community Welfare Initiative',
        titleBn: item.title_bn || 'সময়ের বাতিঘর — একতাই শক্তি',
        titleEn: item.title_en || 'Samoyer Batighor',
        subtitleBn: item.description_bn || 'মানবসেবায় নিবেদিত একদল স্বপ্নবাজ তরুণ ও সামাজিক নেতৃত্ব।',
        subtitleEn: item.description_en || 'Dedicated to social welfare and community empowerment.',
        primaryLink: '/member-registration',
        primaryTextBn: 'সদস্য আবেদন করুন',
        primaryTextEn: 'Join as a Member',
        secondaryLink: '/about',
        secondaryTextBn: 'আমাদের সম্পর্কে',
        secondaryTextEn: 'Learn More',
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
      className="relative w-full h-[520px] sm:h-[580px] md:h-[640px] lg:h-[700px] overflow-hidden bg-slate-950"
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
            {/* Background Image with Zoom animation */}
            <div 
              className={`absolute inset-0 bg-cover bg-center transition-transform ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
              style={{ 
                backgroundImage: `url(${slide.image})`,
                transitionDuration: '7000ms'
              }}
            />

            {/* Clean clear background - image fully visible as requested */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Slide Text Content */}
            <div className="container mx-auto px-4 max-w-7xl h-full flex items-center relative z-20">
              <div className="max-w-xl md:max-w-2xl text-left py-10 bg-slate-950/40 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/20 shadow-2xl">
                {/* Floating Tag / Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-bold mb-3 sm:mb-4 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'bn' ? slide.tagBn : slide.tagEn}</span>
                </div>

                {/* Main Heading */}
                <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 sm:mb-4 tracking-tight drop-shadow-lg">
                  {language === 'bn' ? slide.titleBn : slide.titleEn}
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm md:text-base text-slate-100 max-w-lg leading-relaxed mb-5 sm:mb-6 font-medium drop-shadow">
                  {language === 'bn' ? slide.subtitleBn : slide.subtitleEn}
                </p>

                {/* Single prominent button */}
                <div className="flex items-center gap-3">
                  <Button 
                    size="lg" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/40 text-sm sm:text-base px-6 h-11 sm:h-12 rounded-xl transition-all hover:scale-105"
                    asChild
                  >
                    <Link to={slide.primaryLink}>
                      <Users className="w-4 h-4 mr-2" />
                      <span>{language === 'bn' ? slide.primaryTextBn : slide.primaryTextEn}</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
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
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-emerald-600/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-emerald-600/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators (Pill Dots) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentSlide
                ? 'w-7 sm:w-9 h-2.5 bg-emerald-400 shadow-sm'
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
