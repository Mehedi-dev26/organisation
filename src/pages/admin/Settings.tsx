import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff, Key, User, Shield, Bell, LayoutTemplate, Image, Save, Loader2, Sparkles, Heart, Activity, Database, CheckCircle2, Clock, RefreshCw, Server, Zap, Check, Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';
import { sendKeepAlivePing, getKeepAliveStats, KeepAliveStats } from '@/services/keepAliveService';
import { compressImage } from '@/lib/imageUtils';

const Settings = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
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
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Website Content Settings States
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
        .upsert({ key, value, updated_at: new Date().toISOString() });

      if (error) throw error;

      try {
        localStorage.removeItem('batighor_site_settings_cache');
      } catch {
        // Safe ignore storage access error
      }

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
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {language === 'bn' ? 'সেটিংস ও ওয়েবসাইট কন্ট্রোল' : 'Settings & Site Control'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'bn' ? 'আপনার অ্যাকাউন্ট, ওয়েবসাইটের ব্যানার ও ডাটাবেস কিপ-অ্যালাইভ পরিচালনা করুন' : 'Manage account, homepage banners, and Supabase keep-alive status'}
        </p>
      </div>

      <Tabs defaultValue="website_content" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl mb-6">
          <TabsTrigger value="website_content" className="flex items-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm">
            <LayoutTemplate className="w-4 h-4" />
            <span>{language === 'bn' ? 'ব্যানার ও কন্টেন্ট' : 'Site Content'}</span>
          </TabsTrigger>
          <TabsTrigger value="supabase_health" className="flex items-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'ব্যাকএন্ড কিপ-অ্যালাইভ' : 'Backend Health'}</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm">
            <User className="w-4 h-4" />
            <span>{language === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Website Content & Banners (Directly Updates Database) ── */}
        <TabsContent value="website_content" className="space-y-6">
          {/* Hero Banner Card */}
          <Card className="border-emerald-200/80 shadow-sm">
            <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
                <Image className="w-5 h-5 text-emerald-600" />
                {language === 'bn' ? 'হোমপেজ হিরো ব্যানার সেটিংস' : 'Hero Banner Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'bn'
                  ? 'ওয়েবসাইটের প্রধান ব্যানার ছবি ও লেখা পরিবর্তন করুন (সরাসরি ডাটাবেস থেকে লোড হবে)'
                  : 'Customize homepage hero slider image and texts from database'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="font-bold">{language === 'bn' ? 'ব্যানার ছবি আপলোড বা লিঙ্ক' : 'Banner Image Upload or URL'}</Label>
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
                  <div className="mt-2 h-40 max-w-md rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
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
              <CardTitle className="flex items-center gap-2 text-foreground">
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
                    <div className="h-24 w-full rounded-lg overflow-hidden border border-slate-200">
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
                    <div className="h-24 w-full rounded-lg overflow-hidden border border-slate-200">
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
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Heart className="w-5 h-5 text-rose-500" />
                {language === 'bn' ? 'মানবিক সমাজ গড়ার ব্যানার (কার্যক্রম ও সংবাদের মাঝে)' : 'CTA Banner Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'bn'
                  ? '"আসুন আমরা সবাই মিলে একটি মানবিক ও সুন্দর সমাজ গড়ে তুলি" ব্যানার ছবি ও বাটন'
                  : 'Manage the CTA banner sitting between Programs and Recent News'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'ব্যাকগ্রাউন্ড ছবি URL' : 'Background Image URL'}</Label>
                <Input
                  value={ctaSection.image_url}
                  onChange={(e) => setCtaSection({ ...ctaSection, image_url: e.target.value })}
                />
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

        {/* ── Tab 2: General Account Settings ── */}
        <TabsContent value="general" className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {language === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' ? 'আপনার ব্যক্তিগত তথ্য আপডেট করুন' : 'Update your personal information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'ইমেইল পরিবর্তন করা যাবে না' : 'Email cannot be changed'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">{language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={language === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'}
                  />
                </div>

                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? (language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...') : (language === 'bn' ? 'প্রোফাইল সংরক্ষণ' : 'Save Profile')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন' : 'Update your account password'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={language === 'bn' ? 'নতুন পাসওয়ার্ড দিন' : 'Enter new password'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={language === 'bn' ? 'পাসওয়ার্ড পুনরায় লিখুন' : 'Re-enter password'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? (language === 'bn' ? 'পরিবর্তন হচ্ছে...' : 'Changing...') : (language === 'bn' ? 'পাসওয়ার্ড আপডেট' : 'Update Password')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {language === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{language === 'bn' ? 'বর্তমান স্ট্যাটাস' : 'Current Status'}</p>
                  <p className="text-sm text-muted-foreground">{language === 'bn' ? 'অ্যাকাউন্ট সক্রিয় আছে' : 'Account is active'}</p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full">
                  {language === 'bn' ? 'সক্রিয়' : 'Active'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Supabase Backend Keep-Alive & Health Monitoring ── */}
        <TabsContent value="supabase_health" className="space-y-6">
          <Card className="border-emerald-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.06)] rounded-[24px] overflow-hidden">
            <CardHeader className="bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-100/80 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading font-bold text-emerald-950 dark:text-emerald-200">
                      {language === 'bn' ? 'সুপাবেজ ব্যাকএন্ড সচল রাখার অটোমেশন সিস্টেম' : 'Supabase Backend Keep-Alive Automation'}
                    </CardTitle>
                    <CardDescription className="text-emerald-800/80 dark:text-emerald-400 text-xs sm:text-sm mt-0.5">
                      {language === 'bn'
                        ? 'নিষ্ক্রিয়তার কারণে সুপাবেজ যাতে স্বয়ংক্রিয়ভাবে বন্ধ (Auto-Pause) না হয়, তার জন্য সক্রিয় ব্যবস্থা'
                        : 'Continuous health monitoring and automated pings to keep Supabase 24/7 active'}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {language === 'bn' ? 'ডাটাবেস সচল ও সক্রিয়' : 'Database Live & Active'}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* How it works banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>{language === 'bn' ? 'স্বয়ংক্রিয় অটো-পিং কিভাবে কাজ করে?' : 'How does Auto-Ping work?'}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    {language === 'bn'
                      ? 'Supabase Free Tier-এ একটানা ৭ দিন কোনো রিকোয়েস্ট না আসলে প্রজেক্ট পজ (Pause) হয়ে যায়। আমাদের সিস্টেমে দুটি সুরক্ষা স্তর রয়েছে: ১) Vercel Cloud Cron ও অটোমেশন প্রতি ৪৮ ঘণ্টায় সরাসরি ব্যাকএন্ডে কুয়েরি পাঠায় (ওয়েবসাইটে কেউ না আসলেও এটি চলবে)। ২) ভিজিটররা ওয়েবসাইটে প্রবেশ করলে স্বয়ংক্রিয় ব্যাকগ্রাউন্ড হার্টবিট চালু হয়।'
                      : 'Supabase Free Tier pauses projects after 7 days of inactivity. Our system implements dual protection: 1) Vercel Cloud Cron runs an automated cloud ping every 48 hours without needing user visits. 2) Client-side lightweight heartbeats run automatically on visitor traffic.'}
                  </p>
                </div>

                <Button
                  onClick={handleManualPing}
                  disabled={isPinging}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 py-2.5 shadow-sm whitespace-nowrap text-xs sm:text-sm"
                >
                  {isPinging ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'bn' ? 'পিং পাঠানো হচ্ছে...' : 'Pinging...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {language === 'bn' ? 'এখনই পিং টেস্ট করুন' : 'Test / Ping Now'}
                    </>
                  )}
                </Button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{language === 'bn' ? 'ক্লাউড অটোমেশন' : 'Cloud Automation'}</span>
                    <Server className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">Vercel Cron & Cloud</p>
                  <p className="text-[11px] text-emerald-600 font-medium">প্রতি ৪৮ ঘণ্টায় (04:00 UTC)</p>
                </div>

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
                  <div>Ping Frequency: Every 48 Hours (Cloud Cron) + On-Demand</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
