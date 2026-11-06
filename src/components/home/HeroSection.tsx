import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  HeartHandshake, 
  Sparkles,
  Sprout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { useHeroBanners, BannerSlide } from '@/services/siteSettingsService';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { 
  preloadAllBanners, 
  preloadBannerImage, 
  isImageCachedSync, 
  markImageLoadedInMemory 
} from '@/services/bannerCacheService';
import { cn } from '@/lib/utils';

const HeroSection = () => {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Track loaded state for instant smooth fade-in (never a black screen)
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});

  // Realtime subscription for instant updates on admin banner save
  useRealtimeSubscription({ table: 'site_settings', queryKey: ['hero-banners'] });

  // Fetch dynamic banner directly from Supabase database with instant local-first cache
  const { data: dbBanners } = useHeroBanners();

  const slides: BannerSlide[] = dbBanners && dbBanners.length > 0 ? dbBanners : [
    {
      id: 'fallback-1',
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1600&q=80',
      tagBn: 'সবসময় আপনার পাশে - একটি স্বেচ্ছাসেবী সংগঠন',
      tagEn: 'Always by your side - A voluntary welfare organization',
      titleBn: 'সময়ের বাতিঘর — মানবতার সেবায় নিবেদিত',
      titleEn: 'Samoyer Batighor',
      subtitleBn: 'একটি অরাজনৈতিক, অলাভজনক ও সামাজিক স্বেচ্ছাসেবী সংগঠন। নওগাঁ জেলাসহ সমগ্র দেশের অসহায় ও সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানোই আমাদের অঙ্গীকার।',
      subtitleEn: 'A non-political, non-profit voluntary humanitarian organization committed to serving underprivileged people in Naogaon and across Bangladesh.',
    }
  ];

  // Warm-up cache and check instant sync cache on mount or slides change
  useEffect(() => {
    if (!slides || slides.length === 0) return;

    // Preload all banners into Cache Storage & browser memory
    preloadAllBanners(slides);

    // Synchronously check if images are already cached
    const initialLoaded: Record<string, boolean> = {};
    slides.forEach((slide) => {
      if (slide.image && isImageCachedSync(slide.image)) {
        initialLoaded[slide.id] = true;
      }
      if (slide.imageMobile && isImageCachedSync(slide.imageMobile)) {
        initialLoaded[`${slide.id}-mobile`] = true;
      }
    });

    if (Object.keys(initialLoaded).length > 0) {
      setLoadedMap((prev) => ({ ...prev, ...initialLoaded }));
    }
  }, [slides]);

  // Pre-decode next slide whenever currentSlide changes for zero-lag slide transition
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const nextIndex = (currentSlide + 1) % slides.length;
    const nextSlide = slides[nextIndex];
    if (nextSlide?.image) {
      preloadBannerImage(nextSlide.image, 'auto');
    }
    if (nextSlide?.imageMobile) {
      preloadBannerImage(nextSlide.imageMobile, 'auto');
    }
  }, [currentSlide, slides]);

  // Auto-play slide rotation
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

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
      id="hero-banner-section"
      className="relative w-full h-[520px] sm:h-[580px] md:h-[620px] lg:h-[660px] overflow-hidden bg-gradient-to-br from-[#062415] via-[#0A3D24] to-[#041A0E]"
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
      {/* 1. Ambient Branded Canvas & Animated Shimmer (Permanently prevents black screens) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Soft radial emerald light gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.22),transparent_70%)]" />
        
        {/* Subtle animated ambient wave / shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-pulse" />

        {/* Watermarked Batighor Brand Pattern */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full border-2 border-emerald-400/30 flex items-center justify-center mb-3">
              <Sprout className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400/50" />
            </div>
            <p className="text-xs font-bold text-emerald-200/40 tracking-widest font-heading">
              সময়ের বাতিঘর • মানবতার সেবায় নিবেদিত
            </p>
          </div>
        </div>
      </div>

      {/* 2. Slides Rendering */}
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        const hasTextContent = slide.showContent !== false && !!(slide.titleBn || slide.titleEn || slide.subtitleBn || slide.subtitleEn);
        const isDesktopLoaded = loadedMap[slide.id] || isImageCachedSync(slide.image);
        const isMobileLoaded = slide.imageMobile ? (loadedMap[`${slide.id}-mobile`] || isImageCachedSync(slide.imageMobile)) : isDesktopLoaded;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Desktop Banner Image (eager fetchPriority on first slide) */}
            <img
              src={slide.image}
              alt={slide.titleBn || 'সময়ের বাতিঘর ব্যানার'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => {
                markImageLoadedInMemory(slide.image);
                setLoadedMap((prev) => ({ ...prev, [slide.id]: true }));
              }}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-all ease-out",
                isActive ? "scale-105" : "scale-100",
                slide.imageMobile ? "hidden sm:block" : "block",
                isDesktopLoaded ? "opacity-100" : "opacity-0"
              )}
              style={{ 
                transitionDuration: '7000ms, 600ms', 
                transitionProperty: 'transform, opacity' 
              }}
            />

            {/* Mobile Banner Image (Dedicated mobile banner if uploaded) */}
            {slide.imageMobile && (
              <img
                src={slide.imageMobile}
                alt={slide.titleBn || 'সময়ের বাতিঘর মোবাইল ব্যানার'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => {
                  markImageLoadedInMemory(slide.imageMobile!);
                  setLoadedMap((prev) => ({ ...prev, [`${slide.id}-mobile`]: true }));
                }}
                className={cn(
                  "sm:hidden absolute inset-0 w-full h-full object-cover transition-all ease-out",
                  isActive ? "scale-105" : "scale-100",
                  isMobileLoaded ? "opacity-100" : "opacity-0"
                )}
                style={{ 
                  transitionDuration: '7000ms, 600ms', 
                  transitionProperty: 'transform, opacity' 
                }}
              />
            )}

            {/* Subtle soft gradient sketch on the left for text legibility (when text is present) */}
            {hasTextContent && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 bg-gradient-to-r from-black/55 via-transparent to-transparent pointer-events-none" />
              </>
            )}
            
            {/* Bottom gradient fade matching deep emerald footer theme */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#062415]/90 via-[#062415]/30 to-transparent pointer-events-none" />

            {/* Slide Text Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full flex items-center relative z-20">
              <div className="max-w-xl md:max-w-2xl text-left py-8 sm:py-12">
                
                {hasTextContent && (
                  <>
                    {/* Floating Tag / Badge */}
                    {(slide.tagBn || slide.tagEn) && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/80 backdrop-blur-xs text-white text-xs sm:text-sm font-bold mb-3 sm:mb-4 shadow-sm border border-emerald-400/30">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{language === 'bn' ? slide.tagBn : slide.tagEn}</span>
                      </div>
                    )}

                    {/* Main Heading with Crisp Shadow */}
                    {(slide.titleBn || slide.titleEn) && (
                      <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight sm:leading-[1.2] mb-3 sm:mb-4 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                        {language === 'bn' ? slide.titleBn : slide.titleEn}
                      </h1>
                    )}

                    {/* Subtitle */}
                    {(slide.subtitleBn || slide.subtitleEn) && (
                      <p className="text-xs sm:text-sm md:text-base text-slate-100 max-w-xl leading-relaxed mb-6 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                        {language === 'bn' ? slide.subtitleBn : slide.subtitleEn}
                      </p>
                    )}
                  </>
                )}

                {/* Unified Compact Aligned Buttons: সদস্য আবেদন & চাঁদা / অনুদান */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
                  
                  {/* ১. সদস্য আবেদন করুন */}
                  <Button 
                    size="sm" 
                    className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-105 inline-flex items-center gap-2"
                    asChild
                  >
                    <Link to="/member-registration">
                      <Users className="w-4 h-4" />
                      <span>{language === 'bn' ? 'সদস্য আবেদন' : 'Apply for Membership'}</span>
                    </Link>
                  </Button>

                  {/* ২. চাঁদা / অনুদান */}
                  <Button 
                    size="sm" 
                    className="h-10 px-5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-105 inline-flex items-center gap-2"
                    asChild
                  >
                    <Link to="/member-dashboard/pay-dues">
                      <HeartHandshake className="w-4 h-4" />
                      <span>{language === 'bn' ? 'চাঁদা / অনুদান' : 'Pay Dues / Donate'}</span>
                    </Link>
                  </Button>

                </div>

              </div>
            </div>
          </div>
        );
      })}

      {/* Slider Controls: Previous & Next Buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-emerald-600 text-white backdrop-blur-xs border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-emerald-600 text-white backdrop-blur-xs border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
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
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentSlide
                    ? 'w-7 sm:w-8 h-2 bg-emerald-400 shadow-xs'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSection;
