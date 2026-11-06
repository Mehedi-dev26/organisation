/**
 * bannerCacheService.ts
 * Enterprise-grade multi-tier caching, preloading, and instant delivery for homepage hero banners.
 * - Layer 1: In-memory image decode cache (0ms instant paint)
 * - Layer 2: Browser Cache Storage API (persistent disk cache across page loads)
 * - Layer 3: Head <link rel="preload"> scanner hints
 * - Layer 4: Progressive warm-up for next slides
 */

export const BANNER_CACHE_NAME = 'batighor-banner-cache-v1';

// In-memory set of URLs that have already been decoded and loaded in the current browser session
const inMemoryLoadedSet = new Set<string>();

/**
 * Checks synchronously whether an image URL is already in-memory or loaded by the browser
 */
export const isImageCachedSync = (url?: string | null): boolean => {
  if (!url) return false;
  if (inMemoryLoadedSet.has(url)) return true;

  if (typeof window !== 'undefined') {
    try {
      const img = new Image();
      img.src = url;
      if (img.complete && img.naturalWidth > 0) {
        inMemoryLoadedSet.add(url);
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
};

/**
 * Mark a URL as loaded in memory
 */
export const markImageLoadedInMemory = (url: string) => {
  if (url) {
    inMemoryLoadedSet.add(url);
  }
};

/**
 * Preload an image URL into browser cache, Cache Storage API, and memory
 */
export const preloadBannerImage = async (
  url: string,
  priority: 'high' | 'auto' = 'auto'
): Promise<boolean> => {
  if (!url || typeof window === 'undefined') return false;

  // 1. If already known in memory, return immediately
  if (inMemoryLoadedSet.has(url)) return true;

  try {
    // 2. Inject <link rel="preload"> in document head if high priority
    if (priority === 'high') {
      const existingLink = document.querySelector(`link[rel="preload"][href="${url}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        (link as any).fetchPriority = 'high';
        document.head.appendChild(link);
      }
    }

    // 3. Cache Storage API persistent cache (offline-ready, instant second-load)
    if ('caches' in window) {
      caches.open(BANNER_CACHE_NAME).then(async (cache) => {
        try {
          const match = await cache.match(url);
          if (!match) {
            // Fetch and store in Cache Storage
            const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
            if (response.ok) {
              await cache.put(url, response.clone());
            }
          }
        } catch {
          // Cross-origin safe fallback
        }
      }).catch(() => {});
    }

    // 4. Memory decode with new Image()
    return await new Promise<boolean>((resolve) => {
      const img = new Image();
      (img as any).fetchPriority = priority;
      img.decoding = 'async';
      img.src = url;

      if (img.complete && img.naturalWidth > 0) {
        inMemoryLoadedSet.add(url);
        resolve(true);
        return;
      }

      img.onload = async () => {
        try {
          if ('decode' in img) {
            await img.decode();
          }
        } catch {
          // ignore decode errors on unsupported browsers
        }
        inMemoryLoadedSet.add(url);
        resolve(true);
      };

      img.onerror = () => {
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('Banner preload warning:', err);
    return false;
  }
};

/**
 * Preloads all banner slides in order:
 * Primary (first slide desktop + mobile) gets highest priority,
 * remaining slides are warmed up in the background.
 */
export const preloadAllBanners = (slides: Array<{ image?: string; imageMobile?: string; image_url?: string; image_mobile_url?: string }>) => {
  if (!slides || slides.length === 0 || typeof window === 'undefined') return;

  const first = slides[0];
  const firstDesktop = first?.image || (first as any)?.image_url;
  const firstMobile = first?.imageMobile || (first as any)?.image_mobile_url;

  // Immediate high-priority preload for first visible slide
  if (firstDesktop) {
    preloadBannerImage(firstDesktop, 'high');
  }
  if (firstMobile) {
    preloadBannerImage(firstMobile, 'high');
  }

  // Background warm-up for subsequent slides (slight delay to prioritize initial page load)
  setTimeout(() => {
    slides.slice(1).forEach((slide) => {
      const desktop = slide?.image || (slide as any)?.image_url;
      const mobile = slide?.imageMobile || (slide as any)?.image_mobile_url;
      if (desktop) preloadBannerImage(desktop, 'auto');
      if (mobile) preloadBannerImage(mobile, 'auto');
    });
  }, 1000);
};
