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
import { Eye, EyeOff, Key, User, Shield, Bell, LayoutTemplate, Image, Save, Loader2, Sparkles, Heart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';

const Settings = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {language === 'bn' ? 'সেটিংস ও ওয়েবসাইট কন্ট্রোল' : 'Settings & Site Control'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'bn' ? 'আপনার অ্যাকাউন্ট এবং ওয়েবসাইটের ব্যানার ও কন্টেন্ট ডাটাবেস থেকে পরিচালনা করুন' : 'Manage your account and customize homepage banners/content dynamically'}
        </p>
      </div>

      <Tabs defaultValue="website_content" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="website_content" className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <LayoutTemplate className="w-4 h-4" />
            <span>{language === 'bn' ? 'ব্যানার ও কন্টেন্ট' : 'Site Content & Banners'}</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <User className="w-4 h-4" />
            <span>{language === 'bn' ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings'}</span>
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
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'ব্যানার ছবি URL' : 'Banner Image URL'}</Label>
                <Input
                  value={heroBanner.image_url}
                  onChange={(e) => setHeroBanner({ ...heroBanner, image_url: e.target.value })}
                  placeholder="/images/banner1.jpg"
                />
                {heroBanner.image_url && (
                  <div className="mt-2 h-36 max-w-md rounded-xl overflow-hidden border border-slate-200">
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
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'প্রধান ছবি URL (বাম পাশের বড় ছবি)' : 'Primary Image URL'}</Label>
                  <Input
                    value={aboutSection.image_main}
                    onChange={(e) => setAboutSection({ ...aboutSection, image_main: e.target.value })}
                    placeholder="/images/about1.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'দ্বিতীয় ছবি URL (ডান পাশের ছোট ছবি)' : 'Secondary Image URL'}</Label>
                  <Input
                    value={aboutSection.image_secondary}
                    onChange={(e) => setAboutSection({ ...aboutSection, image_secondary: e.target.value })}
                    placeholder="/images/about2.jpg"
                  />
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
      </Tabs>
    </div>
  );
};

export default Settings;
