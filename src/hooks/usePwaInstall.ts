import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePwaInstall = () => {
  const getGlobalPrompt = (): BeforeInstallPromptEvent | null => {
    if (typeof window !== 'undefined') {
      return (window as any).__batighor_pwa_prompt || null;
    }
    return null;
  };

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(getGlobalPrompt);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // 1. Check if already installed in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        (window as any).__batighor_pwa_installed === true;
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // 2. Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 3. Sync if early global prompt was already captured
    const initialPrompt = getGlobalPrompt();
    if (initialPrompt) {
      setDeferredPrompt(initialPrompt);
      setIsInstallable(true);
    }

    // 4. Event handlers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__batighor_pwa_prompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleCustomInstallable = (e: any) => {
      const promptEvent = e.detail || getGlobalPrompt();
      if (promptEvent) {
        setDeferredPrompt(promptEvent);
        setIsInstallable(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      (window as any).__batighor_pwa_prompt = null;
      (window as any).__batighor_pwa_installed = true;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('batighor_pwa_installable', handleCustomInstallable);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('batighor_pwa_installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('batighor_pwa_installable', handleCustomInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('batighor_pwa_installed', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual_instructions'> => {
    const promptToUse = deferredPrompt || getGlobalPrompt();
    if (promptToUse) {
      try {
        await promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          (window as any).__batighor_pwa_installed = true;
        }
        setDeferredPrompt(null);
        (window as any).__batighor_pwa_prompt = null;
        return choice.outcome;
      } catch (err) {
        console.error('Install prompt trigger error:', err);
        return 'manual_instructions';
      }
    }
    return 'manual_instructions';
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    triggerInstall,
    hasNativePrompt: !!deferredPrompt || !!getGlobalPrompt(),
  };
};
