import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Upload, 
  CheckCircle, 
  ImageIcon, 
  UserPlus, 
  UserCheck, 
  ShieldCheck, 
  HeartHandshake, 
  Receipt, 
  Award, 
  Vote, 
  Sparkles, 
  PhoneCall, 
  ChevronDown, 
  ChevronUp,
  CreditCard,
  Droplet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { compressImage, formatFileSize } from '@/lib/imageUtils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const registrationSchema = z.object({
  full_name: z.string().min(3, 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে'),
  email: z.string().email('সঠিক ইমেইল দিন').optional().or(z.literal('')),
  phone: z.string().min(11, 'সঠিক ফোন নম্বর দিন'),
  address: z.string().min(10, 'সম্পূর্ণ ঠিকানা দিন'),
  occupation: z.string().min(2, 'পেশা লিখুন'),
  blood_group: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MemberRegistration = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [memberType, setMemberType] = useState<'new' | 'existing'>('new');
  const [previousMemberId, setPreviousMemberId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showMobileBenefits, setShowMobileBenefits] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setOriginalSize(file.size);
      setIsCompressing(true);
      
      try {
        const compressed = await compressImage(file, 300, 300, 0.8);
        setCompressedBlob(compressed);
        setCompressedSize(compressed.size);
        
        const previewUrl = URL.createObjectURL(compressed);
        setPhotoPreview(previewUrl);
        
        toast.success(
          language === 'bn' 
            ? `ছবি কম্প্রেস হয়েছে: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`
            : `Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`
        );
      } catch (error) {
        console.error('Compression error:', error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const generateMemberId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `SB-${year}-${random}`;
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);

    try {
      let photoUrl = null;

      if (compressedBlob) {
        const fileName = `pending/${Date.now()}-${photoFile?.name || 'photo.jpg'}`;
        
        const { error: uploadError } = await supabase.storage
          .from('member-photos')
          .upload(fileName, compressedBlob, {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('member-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('members').insert({
        member_id: memberType === 'existing' && previousMemberId ? previousMemberId : generateMemberId(),
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
        occupation: data.occupation,
        blood_group: data.blood_group || null,
        photo_url: photoUrl,
        status: 'pending',
        member_type: memberType === 'existing' ? 'renewal' : 'general',
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success(
        language === 'bn'
          ? 'আপনার আবেদন সফলভাবে জমা হয়েছে!'
          : 'Your application has been submitted successfully!'
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(
        language === 'bn'
          ? 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to submit application. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16 bg-gradient-to-br from-emerald-50/50 via-slate-50 to-emerald-100/30">
          <Card className="max-w-md mx-4 text-center border-2 border-emerald-600/30 shadow-2xl bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="pt-10 pb-10">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-[#006a4e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-white">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-3 font-heading text-slate-800 dark:text-slate-100">
                {language === 'bn' ? 'আবেদন সফল হয়েছে!' : 'Application Submitted!'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                {language === 'bn'
                  ? 'আপনার সদস্য আবেদনটি পর্যালোচনা করা হচ্ছে। অ্যাডমিন প্যানেল অনুমোদনের পর আপনাকে অবহিত করা হবে।'
                  : 'Your membership application has been submitted successfully. You will be notified once reviewed and approved.'}
              </p>
              <Button onClick={() => navigate('/')} className="w-full bg-[#006a4e] hover:bg-[#00523c] text-white" size="lg">
                {language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Go to Homepage'}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const memberBenefits = [
    {
      icon: CreditCard,
      titleBn: 'ডিজিটাল মেম্বার আইডি কার্ড',
      titleEn: 'Digital Member ID Card',
      descBn: 'সংগঠনের অফিসিয়াল ইউনিক মেম্বার আইডি ও ডিজিটাল আইডি কার্ড প্রাপ্তি।',
      descEn: 'Official unique Member ID and instant digital identity verification.'
    },
    {
      icon: Droplet,
      titleBn: 'জরুরি রক্তদান ও চিকিৎসা সেবায় অগ্রাধিকার',
      titleEn: 'Priority in Blood & Medical Aid',
      descBn: 'আপনার বা পরিবারের প্রয়োজনে সংগঠনের রক্তদাতা নেটওয়ার্ক ও সেবায় সর্বোচ্চ অগ্রাধিকার।',
      descEn: 'Top priority access to volunteer blood donors and community emergency support.'
    },
    {
      icon: Receipt,
      titleBn: 'স্বচ্ছ ডিজিটাল চাঁদা ও রসিদ',
      titleEn: 'Transparent Dues & Receipts',
      descBn: 'অনলাইনে চাঁদা পরিশোধ, তাত্ক্ষণিক ডিজিটাল রসিদ ও সংগঠনের বাৎসরিক আয়-ব্যয়ের অডিট দেখার সুবিধা।',
      descEn: 'Online dues tracking, verified PDF receipts, and access to yearly audit reports.'
    },
    {
      icon: Vote,
      titleBn: 'সাংগঠনিক সিদ্ধান্তে ভোটাধিকার',
      titleEn: 'Voting Rights in General Assembly',
      descBn: 'বার্ষিক সাধারণ সভা (AGM)-এ অংশ নিয়ে নেতৃত্ব নির্বাচন ও কার্যক্রমে মতামত প্রকাশ।',
      descEn: 'Participate and vote in annual assemblies to shape key organizational decisions.'
    },
    {
      icon: HeartHandshake,
      titleBn: 'মানবিক ও সামাজিক প্রকল্পে নেতৃত্ব',
      titleEn: 'Leadership in Community Projects',
      descBn: 'ত্রাণ, বৃক্ষরোপণ, শিক্ষাবৃত্তি ও সুবিধাবঞ্চিত শিশুদের কল্যাণে সরাসরি সম্পৃক্ত হওয়ার সুযোগ।',
      descEn: 'Lead and execute relief, tree plantation, scholarships, and social welfare programs.'
    },
    {
      icon: Award,
      titleBn: 'বার্ষিক সম্মাননা ও সার্টিফিকেট',
      titleEn: 'Annual Honors & Certificate',
      descBn: 'সেবামূলক কাজের স্বীকৃতি হিসেবে আনুষ্ঠানিক মেম্বারশিপ সার্টিফিকেট ও বার্ষিক সম্মাননা।',
      descEn: 'Formal certificates of appreciation and awards recognizing community contributions.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      {/* Top Banner */}
      <div className="bg-[#006a4e] text-white py-5 px-4 shadow-sm">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-300" />
              {language === 'bn' ? 'সদস্য রেজিস্ট্রেশন ফরম' : 'Member Registration Form'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
              {language === 'bn' 
                ? 'সময়ের বাতিঘরের সারথি হয়ে মানবতার সেবায় অংশ নিন' 
                : 'Join Samoyer Batighor to serve humanity together'}
            </p>
          </div>
          <div className="text-xs text-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
            <Link to="/" className="hover:text-white transition-colors">
              {language === 'bn' ? 'হোম' : 'Home'}
            </Link>
            <span>/</span>
            <span className="text-white font-medium">
              {language === 'bn' ? 'সদস্য রেজিস্ট্রেশন' : 'Registration'}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Mobile Benefits Collapsible Toggle */}
          <div className="lg:hidden mb-6">
            <button
              type="button"
              onClick={() => setShowMobileBenefits(!showMobileBenefits)}
              className="w-full p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#006a4e] dark:text-emerald-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {language === 'bn' ? 'সদস্য হলে কী কী সুবিধা পাবেন? (দেখুন)' : 'Membership Benefits & Privileges (View)'}
                </span>
              </div>
              {showMobileBenefits ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showMobileBenefits && (
              <div className="mt-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                {memberBenefits.map((benefit, idx) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#006a4e] shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {language === 'bn' ? benefit.titleBn : benefit.titleEn}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'bn' ? benefit.descBn : benefit.descEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* Left Column (Desktop: Member Benefits & Privileges) */}
            <div className="hidden lg:block lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              
              {/* Main Benefits Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-600/20 shadow-xl space-y-5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#006a4e] dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {language === 'bn' ? 'সদস্যদের অধিকার ও সুযোগ' : 'Privileges & Rights'}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-heading font-extrabold text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? 'সদস্য হলে কী কী সুবিধা পাবেন?' : 'Why Become a Member?'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {language === 'bn'
                      ? 'সময়ের বাতিঘরের নিয়মিত সদস্য হিসেবে অন্তর্ভুক্ত হয়ে আপনি পাবেন বিশেষ সাংগঠনিক সুবিধা ও মানবিক কাজে সক্রিয় অংশগ্রহণের সুযোগ।'
                      : 'Join our family and gain accredited membership rights, leadership roles, and emergency medical support.'}
                  </p>
                </div>

                {/* Benefits List */}
                <div className="space-y-4 pt-1">
                  {memberBenefits.map((benefit, idx) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center text-[#006a4e] dark:text-emerald-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {language === 'bn' ? benefit.titleBn : benefit.titleEn}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {language === 'bn' ? benefit.descBn : benefit.descEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Helpline Box */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#006a4e] text-white flex items-center justify-center shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'রেজিস্ট্রেশনে কোনো সমস্যা?' : 'Need Help Registering?'}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'bn' ? 'হটলাইনে যোগাযোগ করুন: ০১৭১২-xxxxxx' : 'Hotline: 01712-xxxxxx'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & Verification Note */}
              <div className="px-5 py-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-5 h-5 text-[#006a4e] shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'আপনার আবেদন জমা হওয়ার পর কেন্দ্রীয় কার্যনির্বাহী কমিটি কর্তৃক যাচাই শেষে সদস্যপদ চূড়ান্ত করা হয়।'
                    : 'Applications are verified and approved by the central executive council.'}
                </span>
              </div>
            </div>

            {/* Right Column (Form Column) */}
            <div className="lg:col-span-7 w-full">
              <Card className="shadow-2xl border-2 border-emerald-600/20 overflow-hidden bg-white/95 dark:bg-card backdrop-blur-sm rounded-2xl">
                <CardHeader className="text-center pb-6 pt-7 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-emerald-50/60 dark:from-emerald-950/30 dark:to-slate-900 border-b border-emerald-100 dark:border-slate-800">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#006a4e] to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md text-white">
                    <Users className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? 'সদস্য রেজিস্ট্রেশন ফর্ম' : 'Member Registration Form'}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'সঠিক তথ্য প্রদান করে নিচে ফরমটি পূরণ করুন'
                      : 'Provide accurate information to apply for membership'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6 px-5 sm:px-8">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                    {/* Photo Upload with auto compression */}
                    <div className="flex flex-col items-center p-5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="relative w-28 h-28 mb-3">
                        {isCompressing ? (
                          <div className="w-full h-full rounded-full border-4 border-emerald-500/40 flex items-center justify-center bg-muted animate-pulse">
                            <ImageIcon className="w-10 h-10 text-emerald-600/50" />
                          </div>
                        ) : photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-full border-4 border-[#006a4e] shadow-md"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full border-4 border-dashed border-emerald-600/30 flex items-center justify-center bg-emerald-50/40 dark:bg-emerald-950/30">
                            <Users className="w-10 h-10 text-emerald-700/50 dark:text-emerald-400/50" />
                          </div>
                        )}
                      </div>
                      
                      {compressedSize > 0 && originalSize > 0 && (
                        <div className="text-[11px] text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full mb-2">
                          {language === 'bn' ? 'কম্প্রেসড:' : 'Compressed:'} {formatFileSize(originalSize)} → {formatFileSize(compressedSize)}
                          {' '}({Math.round((1 - compressedSize / originalSize) * 100)}% {language === 'bn' ? 'কম' : 'smaller'})
                        </div>
                      )}
                      
                      <Label
                        htmlFor="photo"
                        className="cursor-pointer inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#006a4e] hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 dark:bg-emerald-950/60 px-4 py-2 rounded-full transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {isCompressing 
                          ? (language === 'bn' ? 'কম্প্রেস হচ্ছে...' : 'Compressing...') 
                          : (language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo')}
                      </Label>
                      <input
                        type="file"
                        id="photo"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        disabled={isCompressing}
                      />
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        {language === 'bn' ? '(ঐচ্ছিক - ছবি স্বয়ংক্রিয়ভাবে কম্প্রেস হবে)' : '(Optional - auto compressed)'}
                      </p>
                    </div>

                    {/* Member Type Selection */}
                    <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {language === 'bn' ? 'আবেদনের ধরন' : 'Membership Category'}
                      </Label>
                      <RadioGroup
                        value={memberType}
                        onValueChange={(value) => setMemberType(value as 'new' | 'existing')}
                        className="flex gap-4 pt-1"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="new" id="new-member" />
                          <Label htmlFor="new-member" className="flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm font-medium">
                            <UserPlus className="w-4 h-4 text-[#006a4e]" />
                            {language === 'bn' ? 'নতুন সদস্য আবেদন' : 'New Membership'}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="existing" id="existing-member" />
                          <Label htmlFor="existing-member" className="flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm font-medium">
                            <UserCheck className="w-4 h-4 text-[#006a4e]" />
                            {language === 'bn' ? 'পূর্ববর্তী সদস্য নবায়ন' : 'Existing Member Renewal'}
                          </Label>
                        </div>
                      </RadioGroup>

                      {memberType === 'existing' && (
                        <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          <Label htmlFor="previous_member_id" className="text-xs text-slate-600">
                            {language === 'bn' ? 'আগের সদস্য আইডি (জানা থাকলে লিখুন)' : 'Previous Member ID (if known)'}
                          </Label>
                          <Input
                            id="previous_member_id"
                            placeholder={language === 'bn' ? 'যেমন: SB-2023-1234' : 'e.g., SB-2023-1234'}
                            value={previousMemberId}
                            onChange={(e) => setPreviousMemberId(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-xs sm:text-sm font-medium">
                        {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="full_name"
                        placeholder={language === 'bn' ? 'আপনার পূর্ণ নাম লিখুন' : 'Enter your full name'}
                        className="h-10 text-sm"
                        {...register('full_name')}
                      />
                      {errors.full_name && (
                        <p className="text-xs text-destructive">{errors.full_name.message}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                        {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        placeholder="০১৭১২xxxxxx"
                        className="h-10 text-sm"
                        {...register('phone')}
                      />
                      {errors.phone && (
                        <p className="text-xs text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                        {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}{' '}
                        <span className="text-muted-foreground text-xs font-normal">
                          ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
                        </span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        className="h-10 text-sm"
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs sm:text-sm font-medium">
                        {language === 'bn' ? 'বর্তমান ও স্থায়ী ঠিকানা' : 'Address'} <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="address"
                        rows={2}
                        placeholder={
                          language === 'bn'
                            ? 'গ্রাম/মহল্লা, ডাকঘর, উপজেলা, জেলা'
                            : 'Village/Area, Post, Upazila, District'
                        }
                        className="text-sm resize-none"
                        {...register('address')}
                      />
                      {errors.address && (
                        <p className="text-xs text-destructive">{errors.address.message}</p>
                      )}
                    </div>

                    {/* Occupation & Blood Group Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="occupation" className="text-xs sm:text-sm font-medium">
                          {language === 'bn' ? 'পেশা' : 'Occupation'} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="occupation"
                          placeholder={language === 'bn' ? 'যেমন: ছাত্র, শিক্ষক, চাকরিজীবী' : 'Your occupation'}
                          className="h-10 text-sm"
                          {...register('occupation')}
                        />
                        {errors.occupation && (
                          <p className="text-xs text-destructive">{errors.occupation.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium">
                          {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}{' '}
                          <span className="text-muted-foreground text-xs font-normal">
                            ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
                          </span>
                        </Label>
                        <Select onValueChange={(value) => setValue('blood_group', value)}>
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue
                              placeholder={language === 'bn' ? 'রক্তের গ্রুপ' : 'Select blood group'}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {bloodGroups.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3">
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-[#006a4e] hover:bg-[#00523c] text-white font-medium text-sm rounded-lg shadow-md hover:shadow-lg transition-all" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? (language === 'bn' ? 'আবেদন জমা হচ্ছে...' : 'Submitting Application...')
                          : (language === 'bn' ? 'আবেদনপত্র জমা দিন' : 'Submit Application')}
                      </Button>
                    </div>

                    <p className="text-center text-xs text-slate-400 pt-1">
                      {language === 'bn'
                        ? '* চিহ্নিত ঘরগুলো সঠিকভাবে পূরণ করা বাধ্যতামূলক'
                        : '* Marked fields are required'}
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MemberRegistration;
