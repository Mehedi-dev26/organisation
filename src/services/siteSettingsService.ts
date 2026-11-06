import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { preloadAllBanners } from './bannerCacheService';

export interface HeroBannerData {
  id?: string;
  image_url: string;
  image_mobile_url?: string;
  title_bn: string;
  title_en: string;
  tagline_bn: string;
  tagline_en: string;
  subtitle_bn: string;
  subtitle_en: string;
  button_url?: string;
  button_text_bn?: string;
  button_text_en?: string;
  show_content?: boolean;
  is_active?: boolean;
}

export interface BannerSlide {
  id: string;
  image: string;
  imageMobile?: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  tagBn: string;
  tagEn: string;
  showContent?: boolean;
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

// Helper to safely clear settings cache (preserves hero banner cache so users never see black/blank screens)
export const clearSiteSettingsCache = (clearBanners: boolean = false) => {
  try {
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    if (clearBanners) {
      localStorage.removeItem(STORAGE_KEY_HERO_BANNERS);
    }
  } catch {
    // Safe ignore
  }
};

// Helper to manually update and warm hero banners cache
export const setCachedHeroBanners = (slides: BannerSlide[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_HERO_BANNERS, JSON.stringify(slides));
    preloadAllBanners(slides);
  } catch {
    // Safe ignore
  }
};

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
 * with instant placeholder cache and background Supabase Realtime auto-sync
 */
export const useSiteSettings = () => {
  const queryClient = useQueryClient();

  // Listen to realtime changes on site_settings
  useEffect(() => {
    const channel = supabase
      .channel('site_settings_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        () => {
          clearSiteSettingsCache();
          queryClient.invalidateQueries({ queryKey: ['site-settings'] });
          queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
          queryClient.invalidateQueries({ queryKey: ['site-logo'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
    placeholderData: cached || undefined,
    staleTime: 1000 * 15, // 15 seconds
  });
};

/**
 * Fetches hero banners directly from database (site_settings + gallery_images category='banner')
 * with instant placeholder cache so newest uploads appear immediately
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

      // If admin configured multiple banners via hero_banners array
      if (extraBanners && extraBanners.length > 0) {
        extraBanners
          .filter((b) => b.is_active !== false)
          .forEach((b, idx) => {
            const hasContent = b.show_content !== false;
            slides.push({
              id: b.id || `db-hero-${idx}`,
              image: b.image_url,
              imageMobile: b.image_mobile_url || undefined,
              tagBn: hasContent ? (b.tagline_bn || 'সবসময় আপনার পাশে - একটি স্বেচ্ছাসেবী সংগঠন') : '',
              tagEn: hasContent ? (b.tagline_en || 'Always by your side - A voluntary welfare organization') : '',
              titleBn: hasContent ? (b.title_bn || '') : '',
              titleEn: hasContent ? (b.title_en || b.title_bn || '') : '',
              subtitleBn: hasContent ? (b.subtitle_bn || '') : '',
              subtitleEn: hasContent ? (b.subtitle_en || b.subtitle_bn || '') : '',
              showContent: hasContent,
            });
          });
      } else if (mainHero) {
        // Fallback to single primary database banner
        const hasContent = (mainHero as any).show_content !== false;
        slides.push({
          id: 'db-main-hero',
          image: (mainHero as any).image_url || 'https://rbmhzcapomiiduknkfya.supabase.co/storage/v1/object/public/gallery-images/site/hero-desktop-1793532466810-111191.png',
          imageMobile: (mainHero as any).image_mobile_url || 'https://rbmhzcapomiiduknkfya.supabase.co/storage/v1/object/public/gallery-images/site/hero-mobile-1793532516594-111192.png',
          tagBn: hasContent ? ((mainHero as any).tagline_bn || 'সময়ের বাতিঘর') : '',
          tagEn: hasContent ? ((mainHero as any).tagline_en || 'Always by your side - A voluntary welfare organization') : '',
          titleBn: hasContent ? ((mainHero as any).title_bn || 'কুরআনের আলোয় আলোকিত হোক আগামীর প্রজন্ম') : '',
          titleEn: hasContent ? ((mainHero as any).title_en || 'Samoyer Batighor') : '',
          subtitleBn: hasContent ? ((mainHero as any).subtitle_bn || 'সময়ের বাতিঘর স্বেচ্ছাসেবী সংগঠনের উদ্যোগে মক্তবের কোমলমতি শিক্ষার্থীদের নিয়ে এক সুন্দর সকালের আয়োজন।') : '',
          subtitleEn: hasContent ? ((mainHero as any).subtitle_en || '') : '',
          showContent: hasContent,
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
            subtitleBn: img.description_bn || '',
            subtitleEn: img.description_en || '',
          });
        });
      }

      // If database yielded slides, save to cache and preload images immediately
      if (slides.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY_HERO_BANNERS, JSON.stringify(slides));
          preloadAllBanners(slides);
        } catch {
          // Safe ignore localStorage write errors
        }
        return slides;
      }

      // Reliable default with the organization's real official uploaded banner
      const defaultFallback: BannerSlide[] = [
        {
          id: 'official-banner-1',
          image: 'https://rbmhzcapomiiduknkfya.supabase.co/storage/v1/object/public/gallery-images/site/hero-desktop-1793532466810-111191.png',
          imageMobile: 'https://rbmhzcapomiiduknkfya.supabase.co/storage/v1/object/public/gallery-images/site/hero-mobile-1793532516594-111192.png',
          tagBn: 'সময়ের বাতিঘর',
          tagEn: 'Always by your side - A voluntary welfare organization',
          titleBn: 'কুরআনের আলোয় আলোকিত হোক আগামীর প্রজন্ম',
          titleEn: 'Samoyer Batighor',
          subtitleBn: 'সময়ের বাতিঘর স্বেচ্ছাসেবী সংগঠনের উদ্যোগে মক্তবের কোমলমতি শিক্ষার্থীদের নিয়ে এক সুন্দর সকালের আয়োজন। পবিত্র কুরআনের শিক্ষা, নৈতিকতা ও মানবিক মূল্যবোধে গড়ে উঠুক তাদের সুন্দর ভবিষ্যৎ।',
          subtitleEn: 'A non-political, non-profit voluntary humanitarian organization committed to serving underprivileged people in Naogaon and across Bangladesh.',
          showContent: true,
        },
        {
          id: 'official-banner-2',
          image: 'https://rbmhzcapomiiduknkfya.supabase.co/storage/v1/object/public/gallery-images/site/hero-desktop-1793534053528-14677.jpg',
          imageMobile: 'https://rbmhzcapomiiduknkfya.supabase.co/storage/v1/object/public/gallery-images/site/hero-mobile-1793534063740-14677.jpg',
          tagBn: 'সময়ের বাতিঘর',
          tagEn: 'Always by your side',
          titleBn: 'ভোরের পাখিদের পুরস্কার বিতরণী অনুষ্ঠান',
          titleEn: 'Award Ceremony',
          subtitleBn: 'কোরআন পাঠ প্রতিযোগিতায় অংশগ্রহণকারী ভোরের পাখিদের উৎসাহ ও অনুপ্রেরণা জোগাতে সময়ের বাতিঘরের পক্ষ থেকে পুরস্কার বিতরণী অনুষ্ঠান।',
          subtitleEn: 'A voluntary organization dedicated to humanity.',
          showContent: true,
        }
      ];

      return defaultFallback;
    },
    placeholderData: cachedBanners && cachedBanners.length > 0 ? cachedBanners : undefined,
    staleTime: 1000 * 15,
  });
};
