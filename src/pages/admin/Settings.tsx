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
  BadgeCheck,
  Crop,
  Monitor,
  Smartphone,
  Plus,
  Trash2,
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { sendKeepAlivePing, getKeepAliveStats, KeepAliveStats } from '@/services/keepAliveService';
import { compressImage } from '@/lib/imageUtils';
import { LogoCropModal } from '@/components/common/LogoCropModal';
import { Switch } from '@/components/ui/switch';

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

  // Logo Crop Modal States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // 3. Website Content Settings States (Multi-Banner System, About, CTA)
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [heroBannersList, setHeroBannersList] = useState<{
    id: string;
    image_url: string;
    image_mobile_url?: string;
    title_bn: string;
    title_en: string;
    tagline_bn: string;
    tagline_en: string;
    subtitle_bn: string;
    subtitle_en: string;
    show_content: boolean;
    is_active: boolean;
  }[]>([
    {
      id: 'banner-1',
      image_url: '/images/banner1.jpg',
      image_mobile_url: '',
      title_bn: 'একতাই শক্তি, সেবাই ধর্ম — মানবতার সেবায় নিবেদিত',
      title_en: 'Unity is Strength, Service is Religion',
      tagline_bn: 'মানবসেবায় নিবেদিত সামাজিক সংগঠন',
      tagline_en: 'Non-profit Social Welfare Organization',
      subtitle_bn: 'সমাজের পিছিয়ে পড়া মানুষের পাশে দাঁড়ানো, অসহায়দের মুখে হাসি ফোটানো এবং একটি আত্মনির্ভর সমাজ গড়ার অঙ্গীকার।',
      subtitle_en: 'Dedicated to empowering the underprivileged and standing by vulnerable families.',
      show_content: true,
      is_active: true,
    }
  ]);

  const [uploadingBannerIndex, setUploadingBannerIndex] = useState<{ index: number; type: 'desktop' | 'mobile' } | null>(null);

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
            if (row.key === 'hero_banners' && Array.isArray(row.value) && row.value.length > 0) {
              setHeroBannersList(row.value.map((b: any, i: number) => ({
                id: b.id || `banner-${i + 1}`,
                image_url: b.image_url || '/images/banner1.jpg',
                image_mobile_url: b.image_mobile_url || '',
                title_bn: b.title_bn ?? '',
                title_en: b.title_en ?? '',
                tagline_bn: b.tagline_bn ?? '',
                tagline_en: b.tagline_en ?? '',
                subtitle_bn: b.subtitle_bn ?? '',
                subtitle_en: b.subtitle_en ?? '',
                show_content: b.show_content !== false,
                is_active: b.is_active !== false,
              })));
            } else if (row.key === 'hero_banner' && row.value) {
              const hb = row.value as any;
              setHeroBannersList((prev) => {
                if (prev.length > 1) return prev;
                return [{
                  id: 'banner-1',
                  image_url: hb.image_url || '/images/banner1.jpg',
                  image_mobile_url: hb.image_mobile_url || '',
                  title_bn: hb.title_bn ?? '',
                  title_en: hb.title_en ?? '',
                  tagline_bn: hb.tagline_bn ?? '',
                  tagline_en: hb.tagline_en ?? '',
                  subtitle_bn: hb.subtitle_bn ?? '',
                  subtitle_en: hb.subtitle_en ?? '',
                  show_content: hb.show_content !== false,
                  is_active: true,
                }];
              });
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

  // Handler: Select logo image file and open interactive cropper modal
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(language === 'bn' ? 'লোগো ফাইল ১০MB এর কম হতে হবে' : 'Logo file must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handler: Re-crop current active logo
  const handleCropCurrentLogo = () => {
    if (logoUrl) {
      setImageToCrop(logoUrl);
      setCropModalOpen(true);
    }
  };

  // Handler: Save cropped logo blob to database
  const handleCroppedLogoSave = async (croppedBlob: Blob) => {
    setIsUploadingLogo(true);
    try {
      const fileName = `site/logo-${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, croppedBlob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) throw error;
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;

      setLogoUrl(publicUrl);
      await saveLogoToDatabase(publicUrl);
      toast.success(language === 'bn' ? 'লোগো নিখুঁতভাবে ক্রপ ও সর্বত্র কার্যকর হয়েছে!' : 'Logo cropped and updated across website!');
    } catch (err: any) {
      toast.error(err.message || 'লোগো সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handler: Add New Banner to Multi-Banner List
  const handleAddBanner = () => {
    const newId = `banner-${Date.now()}`;
    setHeroBannersList((prev) => [
      ...prev,
      {
        id: newId,
        image_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1600&q=80',
        image_mobile_url: '',
        title_bn: 'নতুন ব্যানার শিরোনাম',
        title_en: 'New Banner Title',
        tagline_bn: 'সবসময় আপনার পাশে - একটি স্বেচ্ছাসেবী সংগঠন',
        tagline_en: 'Always by your side',
        subtitle_bn: 'মানবসেবায় নিবেদিত একটি স্বেচ্ছাসেবী পরিবার।',
        subtitle_en: 'A voluntary organization dedicated to humanity.',
        show_content: true,
        is_active: true,
      }
    ]);
    toast.info(language === 'bn' ? 'নতুন ব্যানার যুক্ত হয়েছে। ছবি ও টেক্সট কাস্টমাইজ করুন।' : 'New banner added. Customize images and text.');
  };

  // Handler: Remove Banner from Multi-Banner List
  const handleRemoveBanner = (index: number) => {
    if (heroBannersList.length <= 1) {
      toast.error(language === 'bn' ? 'কমপক্ষে একটি ব্যানার থাকা আবশ্যক' : 'At least one banner is required');
      return;
    }
    setHeroBannersList((prev) => prev.filter((_, i) => i !== index));
    toast.success(language === 'bn' ? 'ব্যানার সরানো হয়েছে' : 'Banner removed');
  };

  // Handler: Clear text content from banner so only graphic shows
  const handleClearBannerContent = (index: number) => {
    setHeroBannersList((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          title_bn: '',
          title_en: '',
          tagline_bn: '',
          tagline_en: '',
          subtitle_bn: '',
          subtitle_en: '',
          show_content: false,
        };
      }
      return next;
    });
    toast.info(language === 'bn' ? 'কন্টেন্ট সরানো হয়েছে (শুধু ব্যানার ছবি প্রদর্শিত হবে)' : 'Content cleared. Banner image will show cleanly without text.');
  };

  // Handler: Upload Banner Image (Desktop vs Mobile)
  const handleBannerUploadFor = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    type: 'desktop' | 'mobile'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error(language === 'bn' ? 'ছবি ৮MB এর কম হতে হবে' : 'Photo must be under 8MB');
      return;
    }
    setUploadingBannerIndex({ index, type });
    try {
      const width = type === 'desktop' ? 1600 : 800;
      const height = type === 'desktop' ? 900 : 1000;
      const compressedBlob = await compressImage(file, width, height, 0.9);
      const fileName = `site/hero-${type}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, compressedBlob, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;

      setHeroBannersList((prev) => {
        const next = [...prev];
        if (next[index]) {
          if (type === 'desktop') {
            next[index] = { ...next[index], image_url: publicUrl };
          } else {
            next[index] = { ...next[index], image_mobile_url: publicUrl };
          }
        }
        return next;
      });

      toast.success(
        language === 'bn'
          ? `${type === 'desktop' ? 'ডেস্কটপ' : 'মোবাইল'} ব্যানার ছবি সফলভাবে আপলোড হয়েছে`
          : `${type === 'desktop' ? 'Desktop' : 'Mobile'} banner uploaded`
      );
    } catch (err: any) {
      toast.error(err.message || 'আপলোড ব্যর্থ');
    } finally {
      setUploadingBannerIndex(null);
      e.target.value = '';
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
        key = 'hero_banners';
        value = heroBannersList;
        // Also sync first banner to hero_banner for backwards compatibility
        if (heroBannersList.length > 0) {
          await supabase
            .from('site_settings')
            .upsert({ key: 'hero_banner', value: heroBannersList[0], updated_at: new Date().toISOString() }, { onConflict: 'key' });
        }
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

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Crop Current Logo Button */}
                    {logoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCropCurrentLogo}
                        disabled={isUploadingLogo || isSavingLogo}
                        className="rounded-xl border-[#11DFC0]/60 bg-[#11DFC0]/15 hover:bg-[#11DFC0]/30 text-teal-950 dark:text-teal-200 text-xs font-bold gap-1.5 shadow-2xs h-10 px-3.5"
                      >
                        <Crop className="w-4 h-4 text-teal-700 dark:text-teal-300 stroke-[2.4]" />
                        <span>{language === 'bn' ? 'বর্তমান লোগো ক্রপ করুন' : 'Crop & Adjust Logo'}</span>
                      </Button>
                    )}

                    {/* Choose Logo File (Opens Cropper Modal immediately) */}
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-md hover:shadow-lg w-fit h-10">
                      {isUploadingLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{language === 'bn' ? 'ডিভাইস থেকে বাছাই ও ক্রপ করুন' : 'Choose Logo & Crop'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoSelect}
                        disabled={isUploadingLogo || isSavingLogo}
                        className="hidden"
                      />
                    </label>
                  </div>
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
                    {language === 'bn' ? 'স্বয়ংক্রিয় ক্রপিং, পারফেক্ট সাইজিং ও দ্রুত লোডিং নিশ্চয়তা:' : 'Auto Sizing & Zero-Lag Guarantee:'}
                  </span>
                  {language === 'bn'
                    ? 'লোগোটি ক্রপ করার পর স্বয়ংক্রিয়ভাবে ওয়েবসাইটের হেডার, ফুটার, মেম্বার আইডি কার্ড ও ক্যাশিয়ার ভাউচারে সুন্দরভাবে অ্যাডজাস্ট হয়ে যায়।'
                    : 'The cropped logo automatically scales and fits proportionally on navbar, vouchers, cards and footers without distortion.'}
                </div>
              </div>

              {/* Logo Cropper Modal */}
              <LogoCropModal
                isOpen={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                imageSrc={imageToCrop}
                onCropSave={handleCroppedLogoSave}
                isSaving={isUploadingLogo}
              />
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
          {/* Multi-Hero Banner System Card */}
          <Card className="border-emerald-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-transparent dark:bg-emerald-950/20 border-b border-emerald-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-emerald-950 dark:text-emerald-300 text-lg sm:text-xl font-bold">
                    <Layers className="w-5 h-5 text-emerald-700" />
                    {language === 'bn' ? 'হোমপেজ স্লাইডার ব্যানার ও কন্টেন্ট ব্যবস্থাপনা' : 'Homepage Hero Slider & Banners'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {language === 'bn'
                      ? 'একসাথে একাধিক ব্যানার আপলোড করুন। ডেস্কটপ ও মোবাইলের জন্য আলাদা ব্যানার ইমেজ সেট করতে পারেন এবং প্রয়োজনে কন্টেন্ট সরাতে পারেন।'
                      : 'Upload multiple banners with separate desktop and mobile views, and toggle/remove text overlays freely.'}
                  </CardDescription>
                </div>

                {/* Add New Banner Button */}
                <Button
                  type="button"
                  onClick={handleAddBanner}
                  className="rounded-xl bg-[#11DFC0] hover:bg-[#0fcab0] text-slate-950 font-black text-xs sm:text-sm px-4 py-2 gap-1.5 shadow-sm transition-all hover:scale-105 w-fit"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{language === 'bn' ? 'নতুন ব্যানার যোগ করুন' : 'Add New Banner'}</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Banner List */}
              <div className="space-y-6">
                {heroBannersList.map((banner, index) => {
                  const isUploadingThisDesktop = uploadingBannerIndex?.index === index && uploadingBannerIndex?.type === 'desktop';
                  const isUploadingThisMobile = uploadingBannerIndex?.index === index && uploadingBannerIndex?.type === 'mobile';

                  return (
                    <div 
                      key={banner.id || `banner-${index}`}
                      className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-5"
                    >
                      {/* Top Bar of Each Banner Card */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#11DFC0]/20 border border-[#11DFC0]/40 text-teal-900 font-extrabold text-xs flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <span className="font-heading font-black text-sm sm:text-base text-slate-800 dark:text-slate-200">
                            {language === 'bn' ? `ব্যানার স্লাইড ${index + 1}` : `Banner Slide ${index + 1}`}
                          </span>
                          {banner.is_active ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                              {language === 'bn' ? 'সক্রিয়' : 'Active'}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                              {language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
                            </span>
                          )}
                        </div>

                        {/* Controls: Active toggle, Content toggle, Delete */}
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Show/Hide Overlay Content Switch */}
                          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {language === 'bn' ? 'কন্টেন্ট টেক্সট প্রদর্শন' : 'Show Text Overlay'}
                            </span>
                            <Switch
                              checked={banner.show_content}
                              onCheckedChange={(checked) => {
                                setHeroBannersList((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], show_content: checked };
                                  return next;
                                });
                              }}
                            />
                          </div>

                          {/* Active Switch */}
                          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {language === 'bn' ? 'স্লাইড চালু' : 'Enabled'}
                            </span>
                            <Switch
                              checked={banner.is_active}
                              onCheckedChange={(checked) => {
                                setHeroBannersList((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], is_active: checked };
                                  return next;
                                });
                              }}
                            />
                          </div>

                          {/* Delete Banner Button */}
                          {heroBannersList.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBanner(index)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2.5 rounded-xl font-bold text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Dual Upload Section: Desktop Banner vs Mobile Banner */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        
                        {/* 1. Desktop Banner Upload */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-bold text-xs flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                              <Monitor className="w-4 h-4 text-blue-600" />
                              <span>{language === 'bn' ? 'ডেস্কটপ ব্যানার (Desktop Banner - 16:9)' : 'Desktop Banner Image (16:9)'}</span>
                            </Label>
                            
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                              {isUploadingThisDesktop ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              <span>{language === 'bn' ? 'আপলোড' : 'Upload'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBannerUploadFor(e, index, 'desktop')}
                                disabled={isUploadingThisDesktop}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <Input
                            value={banner.image_url}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHeroBannersList((prev) => {
                                const next = [...prev];
                                next[index] = { ...next[index], image_url: val };
                                return next;
                              });
                            }}
                            placeholder="/images/banner1.jpg"
                            className="bg-white dark:bg-slate-900 text-xs"
                          />

                          {banner.image_url && (
                            <div className="h-32 sm:h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs relative group">
                              <img src={banner.image_url} alt="Desktop Preview" className="w-full h-full object-cover" />
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                <span>Desktop View</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Mobile Banner Upload */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-bold text-xs flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                              <Smartphone className="w-4 h-4 text-emerald-600" />
                              <span>{language === 'bn' ? 'মোবাইল ব্যানার (Mobile Banner - Portrait / Fit)' : 'Mobile Banner Image (Mobile Fit)'}</span>
                            </Label>
                            
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                              {isUploadingThisMobile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              <span>{language === 'bn' ? 'আপলোড' : 'Upload'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBannerUploadFor(e, index, 'mobile')}
                                disabled={isUploadingThisMobile}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <Input
                            value={banner.image_mobile_url || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHeroBannersList((prev) => {
                                const next = [...prev];
                                next[index] = { ...next[index], image_mobile_url: val };
                                return next;
                              });
                            }}
                            placeholder={language === 'bn' ? 'মোবাইল ব্যানার ছবি লিঙ্ক (ঐচ্ছিক)' : 'Mobile image URL (optional)'}
                            className="bg-white dark:bg-slate-900 text-xs"
                          />

                          {banner.image_mobile_url ? (
                            <div className="h-32 sm:h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs relative group">
                              <img src={banner.image_mobile_url} alt="Mobile Preview" className="w-full h-full object-cover" />
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white flex items-center gap-1">
                                <Smartphone className="w-3 h-3" />
                                <span>Mobile View Active</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 sm:h-36 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-3 bg-white/50 dark:bg-slate-900/20">
                              <Smartphone className="w-6 h-6 text-slate-400 mb-1" />
                              <p className="text-[11px] text-slate-500 font-medium">
                                {language === 'bn' ? 'মোবাইল ব্যানার আপলোড না করলে স্বয়ংক্রিয়ভাবে ডেস্কটপ ব্যানারটি মোবাইলে সুন্দরভাবে ফিট হয়ে যাবে।' : 'If no mobile banner is uploaded, desktop banner will scale for mobile.'}
                              </p>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Text Content Fields (Only if show_content is enabled) */}
                      {banner.show_content && (
                        <div className="p-4 rounded-xl border border-[#11DFC0]/30 bg-[#11DFC0]/5 space-y-4">
                          <div className="flex items-center justify-between pb-1 border-b border-[#11DFC0]/20">
                            <span className="text-xs font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#11DFC0]" />
                              <span>{language === 'bn' ? 'ব্যানারের টেক্সট কন্টেন্ট ও বিবরণ' : 'Banner Text Content'}</span>
                            </span>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClearBannerContent(index)}
                              className="text-xs text-slate-500 hover:text-slate-800 h-7 px-2"
                            >
                              <span>{language === 'bn' ? 'টেক্সট মুছুন' : 'Clear Text'}</span>
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">{language === 'bn' ? 'ট্যাগলাইন (ছোট ব্যাজ)' : 'Tagline'}</Label>
                              <Input
                                value={banner.tagline_bn}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setHeroBannersList((prev) => {
                                    const next = [...prev];
                                    next[index] = { ...next[index], tagline_bn: val };
                                    return next;
                                  });
                                }}
                                className="bg-white dark:bg-slate-900 text-xs"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">{language === 'bn' ? 'মূল শিরোনাম (বাংলা)' : 'Main Heading'}</Label>
                              <Input
                                value={banner.title_bn}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setHeroBannersList((prev) => {
                                    const next = [...prev];
                                    next[index] = { ...next[index], title_bn: val };
                                    return next;
                                  });
                                }}
                                className="bg-white dark:bg-slate-900 text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">{language === 'bn' ? 'সাবটাইটেল / বিবরণ' : 'Subtitle'}</Label>
                            <Textarea
                              value={banner.subtitle_bn}
                              onChange={(e) => {
                                const val = e.target.value;
                                setHeroBannersList((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], subtitle_bn: val };
                                  return next;
                                });
                              }}
                              rows={2}
                              className="bg-white dark:bg-slate-900 text-xs"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions: Add Another Banner & Save All */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddBanner}
                  className="rounded-xl border-[#11DFC0]/60 bg-[#11DFC0]/15 hover:bg-[#11DFC0]/30 text-teal-950 dark:text-teal-200 font-bold text-xs sm:text-sm px-4 py-2 gap-1.5 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 text-teal-700 dark:text-teal-300 stroke-[3]" />
                  <span>{language === 'bn' ? 'আরও ব্যানার যোগ করুন' : 'Add Another Banner'}</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSaveWebsiteContent('hero')}
                  disabled={isSavingContent}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm px-6 py-2 shadow-md gap-2 w-full sm:w-auto"
                >
                  {isSavingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{language === 'bn' ? 'সকল ব্যানার ও কন্টেন্ট সংরক্ষণ করুন' : 'Save All Banners & Content'}</span>
                </Button>
              </div>
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
