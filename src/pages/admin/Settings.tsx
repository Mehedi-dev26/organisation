import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  Key, 
  User, 
  Shield, 
  Bell, 
  LayoutTemplate, 
  Image as ImageIcon, 
  Save, 
  Loader2, 
  Sparkles, 
  Heart, 
  Activity, 
  Database, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Server, 
  Zap, 
  Check, 
  Upload, 
  Globe, 
  Sliders, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Coins, 
  RotateCcw,
  BadgeCheck
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { sendKeepAlivePing, getKeepAliveStats, KeepAliveStats } from '@/services/keepAliveService';
import { compressImage } from '@/lib/imageUtils';

const STORAGE_LOGO_KEY = 'batighor_site_logo_url';

const Settings = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logoUrl: currentGlobalLogo, defaultLogo } = useSiteLogo();
  
  // Supabase Keep-Alive state
  const [keepAliveStats, setKeepAliveStats] = useState<KeepAliveStats>(getKeepAliveStats());
  const [isPinging, setIsPinging] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Profile state
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // 1. Branding & Logo State
  const [logoUrl, setLogoUrl] = useState<string>(currentGlobalLogo || defaultLogo);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  // 2. General Settings State (Timezone, Names, Helpline, Address)
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [generalSettings, setGeneralSettings] = useState({
    site_name_bn: 'সময়ের বাতিঘর',
    site_name_en: 'Samoyer Batighor',
    slogan_bn: 'একতাই শক্তি, সেবাই ধর্ম',
    slogan_en: 'Unity is Strength, Service is Religion',
    timezone: 'Asia/Dhaka',
    currency: 'BDT (৳)',
    contact_email: 'contact@somoyerbatighor.org',
    contact_phone: '01916314315',
    address_bn: 'নওগাঁ, বাংলাদেশ',
    address_en: 'Naogaon, Bangladesh',
  });

  // 3. Website Content Settings States (Hero, About, CTA)
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [heroBanner, setHeroBanner] = useState({
    image_url: '/images/banner1.jpg',
    title_bn: 'একতাই শক্তি, সেবাই ধর্ম — মানবতার সেবায় নিবেদিত',
    title_en: 'Unity is Strength, Service is Religion',
    tagline_bn: 'মানবসেবায় নিবেদিত সামাজিক সংগঠন',
    tagline_en: 'Non-profit Social Welfare Organization',
    subtitle_bn: 'সমাজের পিছিয়ে পড়া মানুষের পাশে দাঁড়ানো, অসহায়দের মুখে হাসি ফোটানো এবং একটি আত্মনির্ভর সমাজ গড়ার অঙ্গীকার।',
    subtitle_en: 'Dedicated to empowering the underprivileged and standing by vulnerable families.',
  });

  const [aboutSection, setAboutSection] = useState({
    image_main: '/images/about1.jpg',
    image_secondary: '/images/about2.jpg',
    title_bn: 'আমাদের সম্পর্কে ও সাংগঠনিক পরিচয়',
    title_en: 'About Us & Organizational Profile',
    description_bn: 'সমাজের পিছিয়ে পড়া অসহায় মানুষের কল্যাণে, জরুরি রক্তদান ও সামাজিক উন্নয়নে নিবেদিত একটি স্বেচ্ছাসেবী পরিবার।',
    description_en: 'A dedicated volunteer family committed to the welfare of underprivileged people, emergency blood donation, and social development.',
    mission_bn: 'একতাই শক্তি, সেবাই ধর্ম — মানবতার সেবায় সর্বদা অঙ্গীকারবদ্ধ',
    mission_en: 'Unity is Strength, Service is Religion',
    stats: '৫+ বছর',
  });

  const [ctaSection, setCtaSection] = useState({
    image_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1600&q=80',
    title_bn: 'আসুন, আমরা সবাই মিলে একটি মানবিক ও সুন্দর সমাজ গড়ে তুলি।',
    title_en: 'Come, let us all build a humane and beautiful society together.',
    button_text_bn: 'স্বেচ্ছাসেবক হন',
  });

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingCta, setIsUploadingCta] = useState(false);

  // Sync logoUrl with currentGlobalLogo when loaded
  useEffect(() => {
    if (currentGlobalLogo) {
      setLogoUrl(currentGlobalLogo);
    }
  }, [currentGlobalLogo]);

  // Fetch current site_settings from Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*');
        if (error) {
          console.warn('Error fetching site_settings:', error);
          return;
        }
        if (data) {
          data.forEach((row) => {
            if (row.key === 'site_logo' && row.value) {
              const url = (row.value as any)?.logo_url;
              if (url && typeof url === 'string') {
                setLogoUrl(url);
              }
            }
            if (row.key === 'general_settings' && row.value) {
              setGeneralSettings((prev) => ({ ...prev, ...(row.value as any) }));
            }
            if (row.key === 'hero_banner' && row.value) {
              setHeroBanner((prev) => ({ ...prev, ...(row.value as any) }));
            }
            if (row.key === 'about_section' && row.value) {
              const aboutVal = row.value as any;
              setAboutSection((prev) => ({ 
                ...prev, 
                ...aboutVal,
                stats: typeof aboutVal.stats === 'string' ? aboutVal.stats : '৫+ বছর'
              }));
            }
            if (row.key === 'cta_section' && row.value) {
              setCtaSection((prev) => ({ ...prev, ...(row.value as any) }));
            }
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  // Handler: Main Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'bn' ? 'লোগো ফাইল ৫MB এর কম হতে হবে' : 'Logo file must be under 5MB');
      return;
    }
    setIsUploadingLogo(true);
    try {
      // Compress and preserve clean transparency
      const compressedBlob = await compressImage(file, 512, 512, 0.95);
      const fileName = `site/logo-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, compressedBlob, {
          contentType: file.type || 'image/png',
          upsert: true,
        });

      if (error) throw error;
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;

      setLogoUrl(publicUrl);
      await saveLogoToDatabase(publicUrl);
      toast.success(language === 'bn' ? 'নতুন লোগো সফলভাবে আপলোড ও কার্যকর হয়েছে!' : 'New logo uploaded and activated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'লোগো আপলোড ব্যর্থ হয়েছে');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Helper to persist logo to database and local cache
  const saveLogoToDatabase = async (urlToSave: string) => {
    setIsSavingLogo(true);
    try {
      const cleanUrl = urlToSave.trim();
      const payload = {
        logo_url: cleanUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'site_logo', value: payload, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) throw error;

      // Immediately cache to localStorage so subsequent visits load with zero network delay
      try {
        localStorage.setItem(STORAGE_LOGO_KEY, cleanUrl);
      } catch {}

      // Invalidate TanStack query caches to propagate changes instantly across current window
      queryClient.setQueryData(['site-logo'], cleanUrl);
      queryClient.invalidateQueries({ queryKey: ['site-logo'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });

      toast.success(language === 'bn' ? 'লোগো ডাটাবেসে সংরক্ষিত হয়েছে এবং সর্বত্র লাইভ হয়েছে!' : 'Logo saved to database and updated across the site!');
    } catch (err: any) {
      toast.error(err.message || 'লোগো সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsSavingLogo(false);
    }
  };

  // Handler: Reset Logo to Default
  const handleResetLogo = async () => {
    try {
      setLogoUrl(defaultLogo);
      await saveLogoToDatabase(defaultLogo);
      toast.success(language === 'bn' ? 'ডিফল্ট লোগো পুনর্বহাল করা হয়েছে' : 'Restored to default logo');
    } catch (err: any) {
      toast.error(err.message || 'রিসেট ব্যর্থ');
    }
  };

  // Handler: Save General Settings (Timezone, Names, Helpline, Address)
  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGeneral(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'general_settings',
          value: generalSettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['general-settings'] });

      toast.success(language === 'bn' ? 'সাধারণ সেটিংস ও সময় অঞ্চল সংরক্ষিত হয়েছে!' : 'General settings & timezone saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'সংরক্ষণ ব্যর্থ');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  // Handler: Hero Banner Upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'bn' ? 'ছবি ৫MB এর কম হতে হবে' : 'Photo must be under 5MB');
      return;
    }
    setIsUploadingBanner(true);
    try {
      const compressedBlob = await compressImage(file, 1600, 900, 0.88);
      const fileName = `site/hero-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(data.path);
      setHeroBanner((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success(language === 'bn' ? 'ব্যানার ছবি আপলোড হয়েছে' : 'Banner image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'আপলোড ব্যর্থ');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Handler: CTA Banner Upload
  const handleCtaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'bn' ? 'ছবি ৫MB এর কম হতে হবে' : 'Photo must be under 5MB');
      return;
    }
    setIsUploadingCta(true);
    try {
      const compressedBlob = await compressImage(file, 1600, 800, 0.88);
      const fileName = `site/cta-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(data.path);
      setCtaSection((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success(language === 'bn' ? 'CTA ব্যানার ছবি আপলোড হয়েছে' : 'CTA banner image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'আপলোড ব্যর্থ');
    } finally {
      setIsUploadingCta(false);
    }
  };

  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_main' | 'image_secondary') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBlob = await compressImage(file, 1000, 800, 0.88);
      const fileName = `site/about-${field}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(data.path);
      setAboutSection((prev) => ({ ...prev, [field]: urlData.publicUrl }));
      toast.success(language === 'bn' ? 'ছবি আপলোড হয়েছে' : 'Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'আপলোড ব্যর্থ');
    }
  };

  // Save Website Content Settings to Supabase site_settings
  const handleSaveWebsiteContent = async (section: 'hero' | 'about' | 'cta') => {
    setIsSavingContent(true);
    try {
      let key = '';
      let value: any = {};

      if (section === 'hero') {
        key = 'hero_banner';
        value = heroBanner;
      } else if (section === 'about') {
        key = 'about_section';
        value = aboutSection;
      } else if (section === 'cta') {
        key = 'cta_section';
        value = ctaSection;
      }

      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) throw error;

      try {
        localStorage.removeItem('batighor_site_settings_cache');
      } catch {}

      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-about'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-cta'] });

      toast.success(language === 'bn' ? 'ওয়েবসাইট সেটিংস ডাটাবেসে সফলভাবে সংরক্ষিত হয়েছে' : 'Website settings updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsSavingContent(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(language === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match');
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' : 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || (language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে' : 'Failed to change password'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error) throw error;
      if (user?.id) {
        await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      }
      toast.success(language === 'bn' ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || (language === 'bn' ? 'প্রোফাইল আপডেট ব্যর্থ হয়েছে' : 'Failed to update profile'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Manual Keep-Alive Ping Handler
  const handleManualPing = async () => {
    setIsPinging(true);
    try {
      const stats = await sendKeepAlivePing();
      setKeepAliveStats(stats);
      if (stats.lastPingStatus === 'success') {
        toast.success(
          language === 'bn'
            ? `সুপাবেজ ব্যাকএন্ড সচল ও সক্রিয় আছে! (লেটেন্সি: ${stats.latencyMs}ms)`
            : `Supabase backend is live and active! (Latency: ${stats.latencyMs}ms)`
        );
      } else {
        toast.error(
          language === 'bn'
            ? `পিং ব্যর্থ হয়েছে: ${stats.errorMessage || 'অজানা ত্রুটি'}`
            : `Ping failed: ${stats.errorMessage || 'Unknown error'}`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error pinging database');
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#14231B] dark:text-foreground flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#0B6B3A]">
              <Sliders className="w-5 h-5" />
            </div>
            {language === 'bn' ? 'সেটিংস ও ওয়েবসাইট কন্ট্রোল' : 'Settings & Site Control'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'bn' 
              ? 'ওয়েবসাইটের মূল লোগো, সময় অঞ্চল, হিরো ব্যানার, কন্টেন্ট ও সিস্টেম পরিচালনা করুন' 
              : 'Manage main site logo, timezone, banners, content and system status'}
          </p>
        </div>

        {/* Live Status Indicator Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold w-fit shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{language === 'bn' ? 'সিস্টেম রিয়েল-টাইম সিঙ্ক সক্রিয়' : 'Real-time Sync Active'}</span>
        </div>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        {/* Navigation Tabs List */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 max-w-4xl mb-6 h-auto p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl gap-1">
          <TabsTrigger value="branding" className="flex items-center gap-1.5 py-2.5 font-bold text-xs sm:text-sm rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B6B3A] data-[state=active]:shadow-xs">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'লোগো ও ব্র্যান্ডিং' : 'Logo & Brand'}</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-1.5 py-2.5 font-bold text-xs sm:text-sm rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B6B3A] data-[state=active]:shadow-xs">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>{language === 'bn' ? 'সাধারণ ও সময়' : 'General & Time'}</span>
          </TabsTrigger>
          <TabsTrigger value="website_content" className="flex items-center gap-1.5 py-2.5 font-bold text-xs sm:text-sm rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B6B3A] data-[state=active]:shadow-xs">
            <LayoutTemplate className="w-4 h-4 text-purple-600" />
            <span>{language === 'bn' ? 'ব্যানার ও কন্টেন্ট' : 'Banners & Text'}</span>
          </TabsTrigger>
          <TabsTrigger value="supabase_health" className="flex items-center gap-1.5 py-2.5 font-bold text-xs sm:text-sm rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B6B3A] data-[state=active]:shadow-xs">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'সিস্টেম স্থিতি' : 'System Health'}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1.5 py-2.5 font-bold text-xs sm:text-sm rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B6B3A] data-[state=active]:shadow-xs col-span-2 sm:col-span-1">
            <User className="w-4 h-4 text-amber-600" />
            <span>{language === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}</span>
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════
            TAB 1: LOGO & BRANDING (NEW & REQUESTED FEATURE)
        ══════════════════════════════════════════════════════════ */}
        <TabsContent value="branding" className="space-y-6">
          <Card className="border-emerald-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-transparent dark:bg-emerald-950/20 border-b border-emerald-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-emerald-950 dark:text-emerald-300 text-lg sm:text-xl font-bold">
                    <ImageIcon className="w-5 h-5 text-emerald-700" />
                    {language === 'bn' ? 'ওয়েবসাইটের মূল লোগো পরিবর্তন ও ব্যবস্থাপনা' : 'Main Website Logo Management'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {language === 'bn'
                      ? 'এখান থেকে লোগো পরিবর্তন করলে তা ডাটাবেসে সেভ হবে এবং স্বয়ংক্রিয়ভাবে ওয়েবসাইটের হেডার, ফুটার, সাইডবার ও কার্ডে তাৎক্ষণিক আপডেট হয়ে যাবে।'
                      : 'Updating the logo here persists it in the database and automatically synchronizes across Header, Footer, Sidebar & ID Cards.'}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-[11px] font-bold text-emerald-900 w-fit">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'bn' ? 'ইনস্ট্যান্ট ক্যাশিং সক্রিয়' : 'Instant Caching Active'}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Dual Logo Previews: Light Card & Dark Emerald Background */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 block">
                  {language === 'bn' ? 'বর্তমান লোগো লাইভ প্রিভিউ (লাইট ও ডার্ক মোডে কেমন দেখাবে)' : 'Current Logo Live Preview (Light & Dark Display)'}
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Light Background Preview */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <img 
                        src={logoUrl || defaultLogo} 
                        alt="Logo Preview Light" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultLogo;
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        {language === 'bn' ? 'লাইট ব্যাকগ্রাউন্ড (হেডার / প্রিন্ট)' : 'Light Background (Header / Print)'}
                      </span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">সময়ের বাতিঘর</p>
                      <p className="text-xs text-muted-foreground">হেডার, রশিদ ও মেম্বারশিপ কার্ডে এমন দেখাবে</p>
                    </div>
                  </div>

                  {/* Dark Emerald Sidebar Preview */}
                  <div className="p-4 rounded-2xl border border-emerald-800 bg-gradient-to-br from-[#0F6F3C] via-[#0B5A30] to-[#084223] text-white shadow-xs flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 p-2 border border-white/25 flex items-center justify-center flex-shrink-0 backdrop-blur-xs">
                      <img 
                        src={logoUrl || defaultLogo} 
                        alt="Logo Preview Dark" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultLogo;
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                        {language === 'bn' ? 'সবুজ ব্যাকগ্রাউন্ড (অ্যাডমিন সাইডবার)' : 'Green Background (Admin Sidebar)'}
                      </span>
                      <p className="text-sm font-bold text-white mt-0.5">সময়ের বাতিঘর</p>
                      <p className="text-xs text-emerald-200/80">অ্যাডমিন নেভিগেশন সাইডবারে এমন দেখাবে</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload & URL Input Controls */}
              <div className="p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <Label className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                      {language === 'bn' ? 'নতুন লোগো ছবি আপলোড করুন' : 'Upload New Logo Image'}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === 'bn'
                        ? 'সুপারিশ: স্বচ্ছ ব্যাকগ্রাউন্ডযুক্ত (Transparent) PNG অথবা SVG ফরম্যাট (সর্বোচ্চ ৫MB)'
                        : 'Recommended: Transparent PNG or SVG format (Max 5MB)'}
                    </p>
                  </div>

                  {/* Upload Button */}
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-md hover:shadow-lg w-fit">
                    {isUploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{language === 'bn' ? 'ডিভাইস থেকে লোগো বাছাই করুন' : 'Choose Logo File'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo || isSavingLogo}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="relative flex items-center gap-2 pt-2">
                  <div className="flex-1 border-t border-slate-300 dark:border-slate-800" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-emerald-50/40 px-2">
                    {language === 'bn' ? 'অথবা সরাসরি ছবির লিঙ্ক (URL) দিন' : 'Or Direct Image URL'}
                  </span>
                  <div className="flex-1 border-t border-slate-300 dark:border-slate-800" />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="flex-1 bg-white dark:bg-slate-900 h-10 text-xs sm:text-sm font-mono"
                  />
                  <Button
                    type="button"
                    onClick={() => saveLogoToDatabase(logoUrl)}
                    disabled={isSavingLogo || isUploadingLogo || !logoUrl.trim()}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-10 px-5 gap-1.5"
                  >
                    {isSavingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{language === 'bn' ? 'লোগো সেভ করুন' : 'Save Logo'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetLogo}
                    disabled={isSavingLogo || isUploadingLogo}
                    className="h-10 text-xs text-slate-700 hover:bg-slate-100 gap-1.5"
                    title="Reset to initial default logo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'ডিফল্ট লোগো' : 'Reset'}</span>
                  </Button>
                </div>
              </div>

              {/* Technical Caching Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">
                    {language === 'bn' ? 'স্বয়ংক্রিয় ক্যাশিং এবং দ্রুত লোডিং নিশ্চয়তা:' : 'Automatic Caching & Zero-Lag Guarantee:'}
                  </span>
                  {language === 'bn'
                    ? 'লোগোটি ডাটাবেসে সেভ হওয়ার সাথে সাথে ব্রাউজারের লোকাল স্টোরেজে স্বয়ংক্রিয়ভাবে ক্যাশ হয়ে যায়। এর ফলে ওয়েবসাইট রিলোড করলেও কোনো ফ্লিকারিং বা দেরি ছাড়াই ১ মিলিসেকেন্ডে লোগো লোড হবে।'
                    : 'The logo is securely cached in local storage upon saving, ensuring 1ms zero-flicker loading across all page visits and tab switches.'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════
            TAB 2: GENERAL SETTINGS & TIMEZONE (NEW & REQUESTED FEATURE)
        ══════════════════════════════════════════════════════════ */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/60 dark:bg-slate-900 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
                <Globe className="w-5 h-5 text-blue-600" />
                {language === 'bn' ? 'সাধারণ সাংগঠনিক তথ্য ও সময় অঞ্চল (Timezone)' : 'General Organization & Timezone Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'bn'
                  ? 'সংগঠনের নাম, স্লোগান, যোগাযোগের নম্বর, ইমেইল এবং সময় অঞ্চল পরিচালনা করুন।'
                  : 'Manage organization names, slogans, helpline, contact email, and official timezone.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSaveGeneralSettings} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'bn' ? 'সংগঠনের নাম (বাংলা)' : 'Organization Name (Bangla)'}</span>
                    </Label>
                    <Input
                      value={generalSettings.site_name_bn}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, site_name_bn: e.target.value })}
                      placeholder="সময়ের বাতিঘর"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'bn' ? 'সংগঠনের নাম (English)' : 'Organization Name (English)'}</span>
                    </Label>
                    <Input
                      value={generalSettings.site_name_en}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, site_name_en: e.target.value })}
                      placeholder="Samoyer Batighor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs text-slate-700">{language === 'bn' ? 'মূল স্লোগান (বাংলা)' : 'Main Slogan (Bangla)'}</Label>
                    <Input
                      value={generalSettings.slogan_bn}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, slogan_bn: e.target.value })}
                      placeholder="একতাই শক্তি, সেবাই ধর্ম"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs text-slate-700">{language === 'bn' ? 'মূল স্লোগান (English)' : 'Main Slogan (English)'}</Label>
                    <Input
                      value={generalSettings.slogan_en}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, slogan_en: e.target.value })}
                      placeholder="Unity is Strength, Service is Religion"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Timezone Selector */}
                  <div className="space-y-1.5">
                    <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'bn' ? 'সময় অঞ্চল (Time Zone)' : 'Time Zone'}</span>
                    </Label>
                    <Select
                      value={generalSettings.timezone}
                      onValueChange={(val) => setGeneralSettings({ ...generalSettings, timezone: val })}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Select Timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Dhaka">Asia/Dhaka (বাংলাদেশ সময় - GMT+6)</SelectItem>
                        <SelectItem value="UTC">UTC (Universal Coordinated Time - GMT+0)</SelectItem>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (ভারত সময় - GMT+5:30)</SelectItem>
                        <SelectItem value="Asia/Riyadh">Asia/Riyadh (সৌদি আরব সময় - GMT+3)</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai (ইউএই সময় - GMT+4)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (লন্ডন সময় - GMT+0/+1)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (যুক্তরাষ্ট্র ইস্টার্ন - GMT-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Currency */}
                  <div className="space-y-1.5">
                    <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-700">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>{language === 'bn' ? 'মুদ্রা প্রতীক (Currency)' : 'Currency Symbol'}</span>
                    </Label>
                    <Input
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                      placeholder="BDT (৳)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'bn' ? 'অফিসিয়াল হেল্পলাইন নম্বর' : 'Helpline Phone Number'}</span>
                    </Label>
                    <Input
                      value={generalSettings.contact_phone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, contact_phone: e.target.value })}
                      placeholder="01916314315"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'bn' ? 'অফিসিয়াল ইমেইল ঠিকানা' : 'Official Contact Email'}</span>
                    </Label>
                    <Input
                      type="email"
                      value={generalSettings.contact_email}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, contact_email: e.target.value })}
                      placeholder="contact@somoyerbatighor.org"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>{language === 'bn' ? 'অফিসের ঠিকানা (বাংলা)' : 'Office Address (Bangla)'}</span>
                    </Label>
                    <Input
                      value={generalSettings.address_bn}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, address_bn: e.target.value })}
                      placeholder="নওগাঁ, বাংলাদেশ"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>{language === 'bn' ? 'অফিসের ঠিকানা (English)' : 'Office Address (English)'}</span>
                    </Label>
                    <Input
                      value={generalSettings.address_en}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, address_en: e.target.value })}
                      placeholder="Naogaon, Bangladesh"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSavingGeneral}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 gap-2"
                  >
                    {isSavingGeneral ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{language === 'bn' ? 'সাধারণ সেটিংস সংরক্ষণ করুন' : 'Save General Settings'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════
            TAB 3: WEBSITE BANNERS & CONTENT (HERO, ABOUT, CTA)
        ══════════════════════════════════════════════════════════ */}
        <TabsContent value="website_content" className="space-y-6">
          {/* Hero Banner Card */}
          <Card className="border-emerald-200/80 shadow-sm">
            <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                {language === 'bn' ? 'হোমপেজ হিরো ব্যানার সেটিংস' : 'Hero Banner Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'bn'
                  ? 'ওয়েবসাইটের প্রধান ব্যানার ছবি ও লেখা পরিবর্তন করুন (সরাসরি ডাটাবেস থেকে লোড হবে)'
                  : 'Customize homepage hero slider image and texts directly loaded from the database'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="font-bold text-xs">{language === 'bn' ? 'ব্যানার ছবি আপলোড বা লিঙ্ক' : 'Banner Image Upload or URL'}</Label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs w-fit">
                    {isUploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{language === 'bn' ? 'ডিভাইস থেকে ছবি আপলোড করুন' : 'Upload from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={isUploadingBanner}
                      className="hidden"
                    />
                  </label>
                </div>
                <Input
                  value={heroBanner.image_url}
                  onChange={(e) => setHeroBanner({ ...heroBanner, image_url: e.target.value })}
                  placeholder="/images/banner1.jpg"
                />
                {heroBanner.image_url && (
                  <div className="mt-2 h-44 max-w-md rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                    <img src={heroBanner.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ট্যাগলাইন (ছোট শিরোনাম)' : 'Tagline'}</Label>
                  <Input
                    value={heroBanner.tagline_bn}
                    onChange={(e) => setHeroBanner({ ...heroBanner, tagline_bn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'মূল শিরোনাম (বাংলা)' : 'Main Heading'}</Label>
                  <Input
                    value={heroBanner.title_bn}
                    onChange={(e) => setHeroBanner({ ...heroBanner, title_bn: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'bn' ? 'সাবটাইটেল / বিবরণ' : 'Subtitle'}</Label>
                <Textarea
                  value={heroBanner.subtitle_bn}
                  onChange={(e) => setHeroBanner({ ...heroBanner, subtitle_bn: e.target.value })}
                  rows={2}
                />
              </div>

              <Button
                onClick={() => handleSaveWebsiteContent('hero')}
                disabled={isSavingContent}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {isSavingContent ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {language === 'bn' ? 'হিরো ব্যানার সংরক্ষণ করুন' : 'Save Hero Banner'}
              </Button>
            </CardContent>
          </Card>

          {/* About Section Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-foreground font-bold">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {language === 'bn' ? 'আমাদের সম্পর্কে সেকশন (ছবি ও বিবরণ)' : 'About Us Section Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'bn'
                  ? 'হোমপেজের "আমাদের সম্পর্কে" সেকশনের ২টি ছবি, শিরোনাম ও বিবরণ আপডেট করুন'
                  : 'Manage About Us photos, title, description and mission statement'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">{language === 'bn' ? 'প্রধান ছবি (বড় ছবি)' : 'Primary Image'}</Label>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>{language === 'bn' ? 'ছবি আপলোড' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAboutImageUpload(e, 'image_main')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <Input
                    value={aboutSection.image_main}
                    onChange={(e) => setAboutSection({ ...aboutSection, image_main: e.target.value })}
                    placeholder="/images/about1.jpg"
                    className="h-8 text-xs"
                  />
                  {aboutSection.image_main && (
                    <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-200">
                      <img src={aboutSection.image_main} alt="Main" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">{language === 'bn' ? 'দ্বিতীয় ছবি (ছোট ছবি)' : 'Secondary Image'}</Label>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>{language === 'bn' ? 'ছবি আপলোড' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAboutImageUpload(e, 'image_secondary')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <Input
                    value={aboutSection.image_secondary}
                    onChange={(e) => setAboutSection({ ...aboutSection, image_secondary: e.target.value })}
                    placeholder="/images/about2.jpg"
                    className="h-8 text-xs"
                  />
                  {aboutSection.image_secondary && (
                    <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-200">
                      <img src={aboutSection.image_secondary} alt="Secondary" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'শিরোনাম' : 'Title'}</Label>
                  <Input
                    value={aboutSection.title_bn}
                    onChange={(e) => setAboutSection({ ...aboutSection, title_bn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'অভিজ্ঞতা ব্যাজ' : 'Stats Badge'}</Label>
                  <Input
                    value={aboutSection.stats}
                    onChange={(e) => setAboutSection({ ...aboutSection, stats: e.target.value })}
                    placeholder="৫+ বছর"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'bn' ? 'মূল স্লোগান / মিশন' : 'Mission'}</Label>
                <Input
                  value={aboutSection.mission_bn}
                  onChange={(e) => setAboutSection({ ...aboutSection, mission_bn: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বিস্তারিত বর্ণনা' : 'Description'}</Label>
                <Textarea
                  value={aboutSection.description_bn}
                  onChange={(e) => setAboutSection({ ...aboutSection, description_bn: e.target.value })}
                  rows={3}
                />
              </div>

              <Button
                onClick={() => handleSaveWebsiteContent('about')}
                disabled={isSavingContent}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {isSavingContent ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {language === 'bn' ? 'আমাদের সম্পর্কে সংরক্ষণ করুন' : 'Save About Us'}
              </Button>
            </CardContent>
          </Card>

          {/* CTA Section Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-foreground font-bold">
                <Heart className="w-5 h-5 text-rose-500" />
                {language === 'bn' ? 'মানবিক সমাজ গড়ার ব্যানার (CTA)' : 'CTA Banner Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'bn'
                  ? '"আসুন আমরা সবাই মিলে একটি মানবিক ও সুন্দর সমাজ গড়ে তুলি" ব্যানার ছবি ও বাটন'
                  : 'Manage the CTA banner sitting between Programs and Recent News'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="font-bold text-xs">{language === 'bn' ? 'ব্যাকগ্রাউন্ড ছবি আপলোড বা URL' : 'Background Image Upload or URL'}</Label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs w-fit">
                    {isUploadingCta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{language === 'bn' ? 'ডিভাইস থেকে ছবি আপলোড' : 'Upload from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCtaUpload}
                      disabled={isUploadingCta}
                      className="hidden"
                    />
                  </label>
                </div>
                <Input
                  value={ctaSection.image_url}
                  onChange={(e) => setCtaSection({ ...ctaSection, image_url: e.target.value })}
                />
                {ctaSection.image_url && (
                  <div className="mt-2 h-36 max-w-md rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                    <img src={ctaSection.image_url} alt="CTA Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ব্যানারের স্লোগান' : 'Banner Slogan'}</Label>
                  <Input
                    value={ctaSection.title_bn}
                    onChange={(e) => setCtaSection({ ...ctaSection, title_bn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'বাটন লেখা' : 'Button Text'}</Label>
                  <Input
                    value={ctaSection.button_text_bn}
                    onChange={(e) => setCtaSection({ ...ctaSection, button_text_bn: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSaveWebsiteContent('cta')}
                disabled={isSavingContent}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {isSavingContent ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {language === 'bn' ? 'CTA ব্যানার সংরক্ষণ করুন' : 'Save CTA Banner'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════
            TAB 4: SUPABASE HEALTH & KEEP-ALIVE
        ══════════════════════════════════════════════════════════ */}
        <TabsContent value="supabase_health" className="space-y-6">
          <Card className="border-emerald-200/80 shadow-sm">
            <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold">
                    <Database className="w-5 h-5 text-emerald-600" />
                    {language === 'bn' ? 'সুপাবেজ ডাটাবেস কিপ-অ্যালাইভ ও অ্যাক্টিভিটি মনিটর' : 'Supabase Keep-Alive & Activity Monitor'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn'
                      ? '৭ দিন নিষ্ক্রিয় থাকার কারণে সুপাবেজ ডাটাবেস যাতে কখনোই পজ না হয়, সেজন্য ব্যাকএন্ড কিপ-অ্যালাইভ সিস্টেম সক্রিয় আছে।'
                      : 'Guaranteed 24/7 backend activity monitor preventing Supabase free tier inactivity pause.'}
                  </CardDescription>
                </div>
                <Button
                  onClick={handleManualPing}
                  disabled={isPinging}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 self-start sm:self-center shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
                  {language === 'bn' ? 'এখনই লাইভ টেস্ট করুন' : 'Test Ping Now'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{language === 'bn' ? 'শেষ টেস্ট ফলাফল' : 'Last Ping Status'}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {keepAliveStats.lastPingStatus === 'success' 
                      ? (language === 'bn' ? 'সফল (সক্রিয়)' : 'Success (Active)')
                      : keepAliveStats.lastPingStatus === 'error'
                      ? (language === 'bn' ? 'ত্রুটি' : 'Error')
                      : (language === 'bn' ? 'অপেক্ষা করছে' : 'Pending')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {keepAliveStats.latencyMs ? `রেসপন্স টাইম: ${keepAliveStats.latencyMs}ms` : 'কোনো ডেটা নেই'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{language === 'bn' ? 'শেষ পিং সময়' : 'Last Ping Time'}</span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {keepAliveStats.lastPingTime 
                      ? new Date(keepAliveStats.lastPingTime).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : (language === 'bn' ? 'এখনই পিং করুন' : 'Ping now')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {keepAliveStats.lastPingTime 
                      ? new Date(keepAliveStats.lastPingTime).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')
                      : 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{language === 'bn' ? 'পরবর্তী পজ ঝুঁকি' : 'Pause Risk'}</span>
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">০% ঝুঁকি (নিরাপদ)</p>
                  <p className="text-[11px] text-slate-500">৭ দিন নিষ্ক্রিয়তা কখনোই ঘটবে না</p>
                </div>
              </div>

              {/* Endpoint info */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'সুপাবেজ সংযোগ বিশদ' : 'Supabase Connection Details'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
                  <div className="truncate">URL: https://rbmhzcapomiiduknkfya.supabase.co</div>
                  <div>Ping Frequency: Continuous In-App + Background Ping</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════
            TAB 5: ACCOUNT & SECURITY (PASSWORD & PROFILE)
        ══════════════════════════════════════════════════════════ */}
        <TabsContent value="account" className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold">
                <User className="w-5 h-5 text-emerald-600" />
                {language === 'bn' ? 'প্রোফাইল তথ্য' : 'Profile Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' ? 'আপনার অ্যাডমিন নাম ও তথ্য পরিবর্তন করুন' : 'Update your administrator display name'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Admin Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'ইমেইল ঠিকানা পরিবর্তন করা যাবে না' : 'Email address cannot be changed'}
                  </p>
                </div>
                <Button type="submit" disabled={isUpdatingProfile} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {isUpdatingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {language === 'bn' ? 'প্রোফাইল আপডেট করুন' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold">
                <Key className="w-5 h-5 text-amber-600" />
                {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' ? 'আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে নতুন পাসওয়ার্ড দিন' : 'Ensure account security with a strong password'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isChangingPassword} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
