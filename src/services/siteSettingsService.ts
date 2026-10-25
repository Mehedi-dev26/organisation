import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HeroBannerData {
  image_url: string;
  title_bn: string;
  title_en: string;
  tagline_bn: string;
  tagline_en: string;
  subtitle_bn: string;
  subtitle_en: string;
  button_url?: string;
  button_text_bn?: string;
  button_text_en?: string;
}

export interface BannerSlide {
  id: string;
  image: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  tagBn: string;
  tagEn: string;
}

export interface AboutSectionData {
  image_main?: string;
  image_secondary?: string;
  title_bn?: string;
  title_en?: string;
  description_bn?: string;
  description_en?: string;
  mission_bn?: string;
  mission_en?: string;
  vision_bn?: string;
  vision_en?: string;
  values_bn?: string;
  values_en?: string;
  stats?: string;
}

export interface CtaSectionData {
  title_bn?: string;
  title_en?: string;
  subtitle_bn?: string;
  subtitle_en?: string;
  image_url?: string;
  button_text_bn?: string;
  button_text_en?: string;
}

const STORAGE_KEY_SETTINGS = 'batighor_site_settings_cache';
const STORAGE_KEY_HERO_BANNERS = 'batighor_hero_banners_cache';

// Helper to get local storage cache safely
export const getCachedSiteSettings = (): Record<string, any> | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getCachedHeroBanners = (): BannerSlide[] | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HERO_BANNERS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Universal hook to fetch all site settings in ONE single request
 * with instant local cache fallback
 */
export const useSiteSettings = () => {
  const cached = getCachedSiteSettings();

  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('site_settings')
        .select('*');

      if (error) {
        console.warn('site_settings fetch warning:', error.message);
        return cached || {};
      }

      const map: Record<string, any> = {};
      data?.forEach((row: any) => {
        if (row?.key && row?.value) {
          map[row.key] = row.value;
        }
      });

      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(map));
      } catch {
        // Safe ignore localStorage write errors
      }

      return map;
    },
    initialData: cached || undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Fetches hero banners directly from database (site_settings + gallery_images category='banner')
 * with instant local cache so there is no flicker or fallback delay
 */
export const useHeroBanners = () => {
  const cachedBanners = getCachedHeroBanners();

  return useQuery({
    queryKey: ['hero-banners'],
    queryFn: async (): Promise<BannerSlide[]> => {
      // 1. Fetch site_settings hero_banner and hero_banners
      const { data: settingsRows } = await (supabase as any)
        .from('site_settings')
        .select('key, value')
        .in('key', ['hero_banner', 'hero_banners']);

      let mainHero: HeroBannerData | null = null;
      let extraBanners: HeroBannerData[] = [];

      settingsRows?.forEach((row: any) => {
        if (row?.key === 'hero_banner' && row?.value) {
          mainHero = row.value as HeroBannerData;
        } else if (row?.key === 'hero_banners' && Array.isArray(row?.value)) {
          extraBanners = row.value as HeroBannerData[];
        }
      });

      // 2. Fetch gallery images marked as banner
      const { data: galleryBanners } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('category', 'banner')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      const slides: BannerSlide[] = [];

      // Primary database banner
      if (mainHero) {
        slides.push({
          id: 'db-main-hero',
          image: (mainHero as any).image_url || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1600&q=80',
          tagBn: (mainHero as any).tagline_bn || 'সবসময় আপনার পাশে - একটি স্বেচ্ছাসেবী সংগঠন',
          tagEn: (mainHero as any).tagline_en || 'Always by your side - A voluntary welfare organization',
          titleBn: (mainHero as any).title_bn || 'সময়ের বাতিঘর — মানবতার সেবায় নিবেদিত',
          titleEn: (mainHero as any).title_en || 'Samoyer Batighor — Dedicated to Humanity',
          subtitleBn: (mainHero as any).subtitle_bn || 'একটি অরাজনৈতিক, অলাভজনক ও সামাজিক স্বেচ্ছাসেবী সংগঠন। সমাজের সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানোই আমাদের মূল অঙ্গীকার।',
          subtitleEn: (mainHero as any).subtitle_en || 'A non-political, non-profit humanitarian organization committed to serving underprivileged people.',
        });
      }

      // Additional array banners from site_settings (if configured by admin)
      if (extraBanners && extraBanners.length > 0) {
        extraBanners.forEach((b, idx) => {
          slides.push({
            id: `db-extra-hero-${idx}`,
            image: b.image_url,
            tagBn: b.tagline_bn || 'মানবসেবায় নিবেদিত সামাজিক সংগঠন',
            tagEn: b.tagline_en || 'Non-profit Social Welfare Organization',
            titleBn: b.title_bn,
            titleEn: b.title_en || b.title_bn,
            subtitleBn: b.subtitle_bn,
            subtitleEn: b.subtitle_en || b.subtitle_bn,
          });
        });
      }

      // Additional gallery banners from database
      if (galleryBanners && galleryBanners.length > 0) {
        galleryBanners.forEach((img) => {
          slides.push({
            id: img.id,
            image: img.image_url,
            tagBn: img.title_bn || 'জনকল্যাণমূলক সামাজিক উদ্যোগ',
            tagEn: img.title_en || 'Community Welfare Initiative',
            titleBn: img.title_bn || 'সময়ের বাতিঘর — একতাই শক্তি',
            titleEn: img.title_en || 'Samoyer Batighor',
            subtitleBn: img.description_bn || 'মানবসেবায় নিবেদিত একদল স্বপ্নবাজ তরুণ ও সামাজিক নেতৃত্ব।',
            subtitleEn: img.description_en || 'Dedicated to social welfare and community empowerment.',
          });
        });
      }

      // If database yielded slides, save to cache
      if (slides.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY_HERO_BANNERS, JSON.stringify(slides));
        } catch {
          // Safe ignore localStorage write errors
        }
        return slides;
      }

      // Reliable default if DB was completely empty
      const defaultFallback: BannerSlide[] = [
        {
          id: 'default-db-1',
          image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1600&q=80',
          tagBn: 'সবসময় আপনার পাশে - একটি স্বেচ্ছাসেবী সংগঠন',
          tagEn: 'Always by your side - A voluntary welfare organization',
          titleBn: 'সময়ের বাতিঘর — মানবতার সেবায় নিবেদিত',
          titleEn: 'Samoyer Batighor',
          subtitleBn: 'একটি অরাজনৈতিক, অলাভজনক ও সামাজিক স্বেচ্ছাসেবী সংগঠন। সমাজের সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানোই আমাদের মূল অঙ্গীকার।',
          subtitleEn: 'A non-political, non-profit humanitarian organization committed to serving underprivileged people.',
        },
      ];

      return defaultFallback;
    },
    initialData: cachedBanners && cachedBanners.length > 0 ? cachedBanners : undefined,
    staleTime: 1000 * 60 * 5,
  });
};
