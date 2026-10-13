import { useState, useMemo, useEffect } from 'react';
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
  Droplet,
  MapPin,
  Briefcase,
  Home,
  Navigation
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
import { 
  bangladeshGeoData, 
  professionsList, 
  getUnionsForUpazila, 
  naogaonUnionsData 
} from '@/data/bangladeshGeoData';

const registrationSchema = z.object({
  full_name: z.string().min(3, 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে'),
  email: z.string().email('সঠিক ইমেইল দিন').optional().or(z.literal('')),
  phone: z.string().min(11, 'সঠিক ১১ ডিজিটের ফোন নম্বর দিন'),
  present_address: z.string().min(3, 'বর্তমান ঠিকানা লিখুন'),
  permanent_division: z.string().min(1, 'বিভাগ নির্বাচন করুন'),
  permanent_district: z.string().min(1, 'জেলা নির্বাচন করুন'),
  permanent_upazila: z.string().min(1, 'উপজেলা নির্বাচন করুন'),
  permanent_union: z.string().min(1, 'ইউনিয়ন/পৌরসভা নির্বাচন করুন'),
  permanent_village: z.string().optional(),
  occupation: z.string().min(2, 'পেশা নির্বাচন করুন'),
  custom_occupation: z.string().optional(),
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

  // Cascading Address State
  const [selectedDivision, setSelectedDivision] = useState<string>('রাজশাহী');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('নওগাঁ');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('নওগাঁ সদর');
  const [selectedUnion, setSelectedUnion] = useState<string>('নওগাঁ পৌরসভা');

  // Profession State
  const [selectedOccupation, setSelectedOccupation] = useState<string>('');
  const [isCustomOccupation, setIsCustomOccupation] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      permanent_division: 'রাজশাহী',
      permanent_district: 'নওগাঁ',
      permanent_upazila: 'নওগাঁ সদর',
      permanent_union: 'নওগাঁ পৌরসভা',
      permanent_village: '',
      occupation: '',
    }
  });

  // Calculate cascading lists
  const divisions = useMemo(() => bangladeshGeoData.map(d => d.name), []);

  const currentDistricts = useMemo(() => {
    const div = bangladeshGeoData.find(d => d.name === selectedDivision);
    return div ? div.districts.map(dist => dist.name) : ['নওগাঁ'];
  }, [selectedDivision]);

  const currentUpazilas = useMemo(() => {
    const div = bangladeshGeoData.find(d => d.name === selectedDivision);
    const dist = div?.districts.find(dst => dst.name === selectedDistrict);
    return dist ? dist.upazilas : Object.keys(naogaonUnionsData);
  }, [selectedDivision, selectedDistrict]);

  const currentUnions = useMemo(() => {
    return getUnionsForUpazila(selectedDistrict, selectedUpazila);
  }, [selectedDistrict, selectedUpazila]);

  // Synchronize defaults on mount
  useEffect(() => {
    setValue('permanent_division', selectedDivision);
    setValue('permanent_district', selectedDistrict);
    setValue('permanent_upazila', selectedUpazila);
    setValue('permanent_union', selectedUnion);
  }, [setValue, selectedDivision, selectedDistrict, selectedUpazila, selectedUnion]);

  const handleDivisionChange = (div: string) => {
    setSelectedDivision(div);
    setValue('permanent_division', div);

    const divObj = bangladeshGeoData.find(d => d.name === div);
    const firstDist = divObj?.districts[0]?.name || 'নওগাঁ';
    setSelectedDistrict(firstDist);
    setValue('permanent_district', firstDist);

    const firstUpazila = divObj?.districts[0]?.upazilas[0] || 'নওগাঁ সদর';
    setSelectedUpazila(firstUpazila);
    setValue('permanent_upazila', firstUpazila);

    const unions = getUnionsForUpazila(firstDist, firstUpazila);
    const firstUnion = unions[0] || 'পৌরসভা';
    setSelectedUnion(firstUnion);
    setValue('permanent_union', firstUnion);
  };

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    setValue('permanent_district', dist);

    const divObj = bangladeshGeoData.find(d => d.name === selectedDivision);
    const distObj = divObj?.districts.find(dst => dst.name === dist);
    const firstUpazila = distObj?.upazilas[0] || (dist === 'নওগাঁ' ? 'নওগাঁ সদর' : 'সদর');
    setSelectedUpazila(firstUpazila);
    setValue('permanent_upazila', firstUpazila);

    const unions = getUnionsForUpazila(dist, firstUpazila);
    const firstUnion = unions[0] || 'পৌরসভা';
    setSelectedUnion(firstUnion);
    setValue('permanent_union', firstUnion);
  };

  const handleUpazilaChange = (upazila: string) => {
    setSelectedUpazila(upazila);
    setValue('permanent_upazila', upazila);

    const unions = getUnionsForUpazila(selectedDistrict, upazila);
    const firstUnion = unions[0] || 'পৌরসভা';
    setSelectedUnion(firstUnion);
    setValue('permanent_union', firstUnion);
  };

  const handleUnionChange = (union: string) => {
    setSelectedUnion(union);
    setValue('permanent_union', union);
  };

  const handleOccupationSelect = (occ: string) => {
    setSelectedOccupation(occ);
    setValue('occupation', occ);
    setIsCustomOccupation(occ === 'অন্যান্য');
  };

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

        if (uploadError) {
          console.warn('Storage upload error, continuing without photo:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('member-photos')
            .getPublicUrl(fileName);
          
          photoUrl = publicUrlData.publicUrl;
        }
      }

      // Build structured permanent address
      const permanentParts = [
        data.permanent_village?.trim(),
        data.permanent_union,
        data.permanent_upazila,
        data.permanent_district,
        data.permanent_division
      ].filter(Boolean);
      const permanentFormatted = permanentParts.join(', ');

      const combinedAddress = `বর্তমান: ${data.present_address.trim()} | স্থায়ী: ${permanentFormatted}`;

      // Resolve final occupation
      const finalOccupation = isCustomOccupation && data.custom_occupation?.trim()
        ? data.custom_occupation.trim()
        : data.occupation;

      const { error } = await supabase.from('members').insert({
        member_id: memberType === 'existing' && previousMemberId ? previousMemberId : generateMemberId(),
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone,
        address: combinedAddress,
        occupation: finalOccupation,
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
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16 px-4 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900">
          <Card className="max-w-md w-full text-center border-2 border-emerald-500/30 shadow-2xl bg-white/90 dark:bg-card/90 backdrop-blur-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <CardContent className="pt-10 pb-10 px-6 sm:px-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 via-teal-600 to-[#006a4e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-700/25 text-white">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-3 font-heading text-slate-800 dark:text-slate-100">
                {language === 'bn' ? 'আবেদন সফল হয়েছে!' : 'Application Submitted!'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                {language === 'bn'
                  ? 'আপনার সদস্য আবেদনটি পর্যালোচনা করা হচ্ছে। কেন্দ্রীয় কার্যনির্বাহী পরিষদ কর্তৃক যাচাই শেষে সদস্যপদ চূড়ান্ত করে আপনাকে অবহিত করা হবে।'
                  : 'Your membership application has been submitted successfully. You will be notified once reviewed and approved.'}
              </p>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-[#006a4e] hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-lg shadow-emerald-700/30 h-11 rounded-xl"
              >
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
      color: 'from-blue-500 to-indigo-600',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200/50 text-blue-600 dark:text-blue-300',
      titleBn: 'ডিজিটাল মেম্বার আইডি কার্ড',
      titleEn: 'Digital Member ID Card',
      descBn: 'সংগঠনের অফিসিয়াল ইউনিক মেম্বার আইডি ও ডিজিটাল আইডি কার্ড প্রাপ্তি।',
      descEn: 'Official unique Member ID and instant digital identity verification.'
    },
    {
      icon: Droplet,
      color: 'from-rose-500 to-red-600',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200/50 text-rose-600 dark:text-rose-300',
      titleBn: 'জরুরি রক্তদান ও চিকিৎসা সেবায় অগ্রাধিকার',
      titleEn: 'Priority in Blood & Medical Aid',
      descBn: 'আপনার বা পরিবারের প্রয়োজনে সংগঠনের রক্তদাতা নেটওয়ার্ক ও সেবায় সর্বোচ্চ অগ্রাধিকার।',
      descEn: 'Top priority access to volunteer blood donors and community emergency support.'
    },
    {
      icon: Receipt,
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/50 text-amber-600 dark:text-amber-300',
      titleBn: 'স্বচ্ছ ডিজিটাল চাঁদা ও রসিদ',
      titleEn: 'Transparent Dues & Receipts',
      descBn: 'অনলাইনে চাঁদা পরিশোধ, তাত্ক্ষণিক ডিজিটাল রসিদ ও সংগঠনের বাৎসরিক আয়-ব্যয়ের অডিট দেখার সুবিধা।',
      descEn: 'Online dues tracking, verified PDF receipts, and access to yearly audit reports.'
    },
    {
      icon: Vote,
      color: 'from-purple-500 to-violet-600',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200/50 text-purple-600 dark:text-purple-300',
      titleBn: 'সাংগঠনিক সিদ্ধান্তে ভোটাধিকার',
      titleEn: 'Voting Rights in General Assembly',
      descBn: 'বার্ষিক সাধারণ সভা (AGM)-এ অংশ নিয়ে নেতৃত্ব নির্বাচন ও কার্যক্রমে মতামত প্রকাশ।',
      descEn: 'Participate and vote in annual assemblies to shape key organizational decisions.'
    },
    {
      icon: HeartHandshake,
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/50 text-emerald-600 dark:text-emerald-300',
      titleBn: 'মানবিক ও সামাজিক প্রকল্পে নেতৃত্ব',
      titleEn: 'Leadership in Community Projects',
      descBn: 'ত্রাণ, বৃক্ষরোপণ, শিক্ষাবৃত্তি ও সুবিধাবঞ্চিত শিশুদের কল্যাণে সরাসরি সম্পৃক্ত হওয়ার সুযোগ।',
      descEn: 'Lead and execute relief, tree plantation, scholarships, and social welfare programs.'
    },
    {
      icon: Award,
      color: 'from-teal-500 to-cyan-600',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200/50 text-teal-600 dark:text-teal-300',
      titleBn: 'বার্ষিক সম্মাননা ও সার্টিফিকেট',
      titleEn: 'Annual Honors & Certificate',
      descBn: 'সেবামূলক কাজের স্বীকৃতি হিসেবে আনুষ্ঠানিক মেম্বারশিপ সার্টিফিকেট ও বার্ষিক সম্মাননা।',
      descEn: 'Formal certificates of appreciation and awards recognizing community contributions.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 selection:bg-emerald-500 selection:text-white">
      <Navbar />
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-[#006a4e] to-teal-900 text-white py-5 px-4 shadow-md border-b border-emerald-700/40">
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
          <div className="text-xs text-emerald-200 flex items-center gap-1.5 self-start sm:self-auto font-medium">
            <Link to="/" className="hover:text-white transition-colors">
              {language === 'bn' ? 'হোম' : 'Home'}
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">
              {language === 'bn' ? 'সদস্য রেজিস্ট্রেশন' : 'Registration'}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8 sm:py-12 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-slate-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900 relative overflow-hidden">
        {/* Ambient background glow orbs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          
          {/* Mobile Benefits Collapsible Toggle */}
          <div className="lg:hidden mb-6">
            <button
              type="button"
              onClick={() => setShowMobileBenefits(!showMobileBenefits)}
              className="w-full p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 text-left flex items-center justify-between shadow-lg shadow-emerald-950/5 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
                    {language === 'bn' ? 'সদস্য হলে কী কী সুবিধা পাবেন?' : 'Membership Benefits & Privileges'}
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    {language === 'bn' ? 'সুবিধাসমূহ দেখতে ক্লিক করুন' : 'Tap to view details'}
                  </span>
                </div>
              </div>
              {showMobileBenefits ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </button>

            {showMobileBenefits && (
              <div className="mt-3 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/25 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {memberBenefits.map((benefit, idx) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {language === 'bn' ? benefit.titleBn : benefit.titleEn}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
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
              
              {/* Main Benefits Card with rich gradient glass style */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-950/10 space-y-5 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-teal-100 text-[#006a4e] dark:from-emerald-950/80 dark:to-teal-950/80 dark:text-emerald-300 border border-emerald-300/40 flex items-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    {language === 'bn' ? 'সদস্যদের অধিকার ও সুযোগ' : 'Privileges & Rights'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    ৬টি বিশেষ সুবিধা
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                    {language === 'bn' ? 'সদস্য হলে কী কী সুবিধা পাবেন?' : 'Why Become a Member?'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {language === 'bn'
                      ? 'সময়ের বাতিঘরের নিয়মিত সদস্য হিসেবে অন্তর্ভুক্ত হয়ে আপনি পাবেন বিশেষ প্রাতিষ্ঠানিক মর্যাদা ও মানবিক কাজে সক্রিয় নেতৃত্ব প্রদানের সুযোগ।'
                      : 'Join our family and gain accredited membership rights, leadership roles, and emergency medical support.'}
                  </p>
                </div>

                {/* Benefits List */}
                <div className="space-y-3.5 pt-1">
                  {memberBenefits.map((benefit, idx) => {
                    const Icon = benefit.icon;
                    return (
                      <div 
                        key={idx} 
                        className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all border border-slate-200/60 dark:border-slate-800 group hover:border-emerald-300/50"
                      >
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
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
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? 'রেজিস্ট্রেশনে কোনো সমস্যা বা প্রশ্ন?' : 'Need Help Registering?'}
                    </p>
                    <p className="text-emerald-800 dark:text-emerald-300 font-semibold mt-0.5">
                      {language === 'bn' ? 'হটলাইন: ০১৯১৬-৩১৪৩১৫ / ০১৭১১-০৫০৮৪১' : 'Hotline: 01916-314315 / 01711-050841'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & Verification Note */}
              <div className="px-5 py-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="leading-relaxed">
                  {language === 'bn'
                    ? 'আপনার আবেদন জমা হওয়ার পর কেন্দ্রীয় কার্যনির্বাহী পরিষদ কর্তৃক যাচাই শেষে সদস্যপদ চূড়ান্ত করা হয়।'
                    : 'Applications are verified and approved by the central executive council.'}
                </span>
              </div>
            </div>

            {/* Right Column (Form Column) */}
            <div className="lg:col-span-7 w-full">
              <Card className="shadow-2xl border-2 border-emerald-500/30 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl">
                <CardHeader className="text-center pb-6 pt-7 px-6 bg-gradient-to-r from-emerald-100/40 via-teal-50/30 to-emerald-100/40 dark:from-emerald-950/40 dark:to-slate-900 border-b border-emerald-100/70 dark:border-slate-800">
                  <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 via-teal-600 to-[#006a4e] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-700/25 text-white">
                    <Users className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? 'সদস্য রেজিস্ট্রেশন ফর্ম' : 'Member Registration Form'}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'সঠিক তথ্য প্রদান করে নিচে ফরমটি পূরণ করুন'
                      : 'Provide accurate information to apply for membership'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6 px-5 sm:px-8 pb-8">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Photo Upload with auto compression */}
                    <div className="flex flex-col items-center p-5 bg-gradient-to-b from-slate-50/80 to-emerald-50/30 dark:from-slate-900/60 dark:to-emerald-950/20 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="relative w-28 h-28 mb-3">
                        {isCompressing ? (
                          <div className="w-full h-full rounded-full border-4 border-emerald-500/40 flex items-center justify-center bg-muted animate-pulse">
                            <ImageIcon className="w-10 h-10 text-emerald-600/50" />
                          </div>
                        ) : photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-full border-4 border-emerald-600 shadow-md"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full border-4 border-dashed border-emerald-600/40 flex items-center justify-center bg-emerald-50/60 dark:bg-emerald-950/40">
                            <Users className="w-10 h-10 text-emerald-700/60 dark:text-emerald-400/60" />
                          </div>
                        )}
                      </div>
                      
                      {compressedSize > 0 && originalSize > 0 && (
                        <div className="text-[11px] text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full mb-2 font-medium">
                          {language === 'bn' ? 'কম্প্রেসড:' : 'Compressed:'} {formatFileSize(originalSize)} → {formatFileSize(compressedSize)}
                          {' '}({Math.round((1 - compressedSize / originalSize) * 100)}% {language === 'bn' ? 'কম' : 'smaller'})
                        </div>
                      )}
                      
                      <Label
                        htmlFor="photo"
                        className="cursor-pointer inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#006a4e] hover:text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 px-4 py-2 rounded-full transition-colors shadow-xs"
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
                    <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {language === 'bn' ? 'আবেদনের ধরন' : 'Membership Category'}
                      </Label>
                      <RadioGroup
                        value={memberType}
                        onValueChange={(value) => setMemberType(value as 'new' | 'existing')}
                        className="flex flex-wrap gap-4 pt-1"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="new" id="new-member" />
                          <Label htmlFor="new-member" className="flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm font-medium">
                            <UserPlus className="w-4 h-4 text-emerald-600" />
                            {language === 'bn' ? 'নতুন সদস্য আবেদন' : 'New Membership'}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="existing" id="existing-member" />
                          <Label htmlFor="existing-member" className="flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm font-medium">
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                            {language === 'bn' ? 'পূর্ববর্তী সদস্য নবায়ন' : 'Existing Member Renewal'}
                          </Label>
                        </div>
                      </RadioGroup>

                      {memberType === 'existing' && (
                        <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          <Label htmlFor="previous_member_id" className="text-xs text-slate-600 dark:text-slate-300">
                            {language === 'bn' ? 'আগের সদস্য আইডি (জানা থাকলে লিখুন)' : 'Previous Member ID (if known)'}
                          </Label>
                          <Input
                            id="previous_member_id"
                            placeholder={language === 'bn' ? 'যেমন: SB-2023-1234' : 'e.g., SB-2023-1234'}
                            value={previousMemberId}
                            onChange={(e) => setPreviousMemberId(e.target.value)}
                            className="h-9 text-xs rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    {/* SECTION: Personal Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Information'}
                        </h4>
                      </div>

                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="full_name" className="text-xs sm:text-sm font-medium">
                          {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="full_name"
                          placeholder={language === 'bn' ? 'আপনার পূর্ণ নাম লিখুন' : 'Enter your full name'}
                          className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:ring-emerald-600"
                          {...register('full_name')}
                        />
                        {errors.full_name && (
                          <p className="text-xs text-destructive">{errors.full_name.message}</p>
                        )}
                      </div>

                      {/* Phone & Email Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Phone Number */}
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                            {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="phone"
                            placeholder="০১৭১২xxxxxx"
                            className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:ring-emerald-600"
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
                            className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:ring-emerald-600"
                            {...register('email')}
                          />
                          {errors.email && (
                            <p className="text-xs text-destructive">{errors.email.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION: Address (বর্তমান ও স্থায়ী ঠিকানা) */}
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {language === 'bn' ? 'বর্তমান ও স্থায়ী ঠিকানা' : 'Present & Permanent Address'}
                        </h4>
                      </div>

                      {/* Present Address (বর্তমান ঠিকানা) */}
                      <div className="space-y-1.5">
                        <Label htmlFor="present_address" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-slate-500" />
                          <span>{language === 'bn' ? 'বর্তমান ঠিকানা' : 'Present Address'}</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="present_address"
                          rows={2}
                          placeholder={
                            language === 'bn'
                              ? 'বর্তমান বসবাসের পূর্ণ ঠিকানা (বাড়ি নং, রোড/মহল্লা, থানা, জেলা)'
                              : 'Current living address (House/Road, Area, Thana, District)'
                          }
                          className="text-sm resize-none rounded-xl border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:ring-emerald-600"
                          {...register('present_address')}
                        />
                        {errors.present_address && (
                          <p className="text-xs text-destructive">{errors.present_address.message}</p>
                        )}
                      </div>

                      {/* Permanent Address Box (স্থায়ী ঠিকানা Dropdowns) */}
                      <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-teal-50/20 dark:from-emerald-950/30 dark:to-slate-900/50 border border-emerald-500/20 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{language === 'bn' ? 'স্থায়ী ঠিকানা (বিভাগ, জেলা, উপজেলা, ইউনিয়ন ড্রপডাউন)' : 'Permanent Address (Dropdown Selection)'}</span>
                            <span className="text-red-500">*</span>
                          </Label>
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                            {language === 'bn' ? 'নওগাঁসহ সমগ্র দেশ' : 'All Bangladesh'}
                          </span>
                        </div>

                        {/* 4-Column Dropdowns: Division, District, Upazila, Union */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          
                          {/* 1. Division (বিভাগ) */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              {language === 'bn' ? 'বিভাগ' : 'Division'}
                            </Label>
                            <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                              <SelectTrigger className="h-9 text-xs rounded-lg border-emerald-300/60 dark:border-emerald-800/60 bg-white dark:bg-slate-900">
                                <SelectValue placeholder="বিভাগ" />
                              </SelectTrigger>
                              <SelectContent>
                                {divisions.map(div => (
                                  <SelectItem key={div} value={div} className="text-xs">
                                    {div}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 2. District (জেলা) */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              {language === 'bn' ? 'জেলা' : 'District'}
                            </Label>
                            <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                              <SelectTrigger className="h-9 text-xs rounded-lg border-emerald-300/60 dark:border-emerald-800/60 bg-white dark:bg-slate-900">
                                <SelectValue placeholder="জেলা" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentDistricts.map(dist => (
                                  <SelectItem key={dist} value={dist} className="text-xs">
                                    {dist}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 3. Upazila (উপজেলা) */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              {language === 'bn' ? 'উপজেলা' : 'Upazila'}
                            </Label>
                            <Select value={selectedUpazila} onValueChange={handleUpazilaChange}>
                              <SelectTrigger className="h-9 text-xs rounded-lg border-emerald-300/60 dark:border-emerald-800/60 bg-white dark:bg-slate-900">
                                <SelectValue placeholder="উপজেলা" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentUpazilas.map(upz => (
                                  <SelectItem key={upz} value={upz} className="text-xs">
                                    {upz}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 4. Union (ইউনিয়ন / পৌরসভা) */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              {language === 'bn' ? 'ইউনিয়ন / ওয়ার্ড' : 'Union / Ward'}
                            </Label>
                            <Select value={selectedUnion} onValueChange={handleUnionChange}>
                              <SelectTrigger className="h-9 text-xs rounded-lg border-emerald-300/60 dark:border-emerald-800/60 bg-white dark:bg-slate-900">
                                <SelectValue placeholder="ইউনিয়ন" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentUnions.map(un => (
                                  <SelectItem key={un} value={un} className="text-xs">
                                    {un}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                        </div>

                        {/* Village / Road detail */}
                        <div className="space-y-1 pt-1">
                          <Label htmlFor="permanent_village" className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {language === 'bn' ? 'গ্রাম / পাড়া / রাস্তা / হোল্ডিং নং' : 'Village / Area / Street'}
                          </Label>
                          <Input
                            id="permanent_village"
                            placeholder={language === 'bn' ? 'যেমন: চকদেব, খাঁসপাড়া, হোল্ডিং ১২/বি' : 'e.g. Village / Area details'}
                            className="h-9 text-xs rounded-lg border-emerald-300/60 dark:border-emerald-800/60 bg-white dark:bg-slate-900"
                            {...register('permanent_village')}
                          />
                        </div>

                        {/* Permanent Address Summary Preview */}
                        <div className="p-2.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-950/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span>
                            {language === 'bn' ? 'স্থায়ী ঠিকানা হবে:' : 'Permanent Address:'}{' '}
                            <strong className="font-bold">
                              {[watch('permanent_village')?.trim(), selectedUnion, selectedUpazila, selectedDistrict, selectedDivision].filter(Boolean).join(', ')}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION: Occupation & Blood Group */}
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {language === 'bn' ? 'পেশা ও রক্তের গ্রুপ' : 'Occupation & Blood Group'}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Profession Dropdown */}
                        <div className="space-y-1.5">
                          <Label className="text-xs sm:text-sm font-medium">
                            {language === 'bn' ? 'পেশা (ড্রপডাউন থেকে নির্বাচন করুন)' : 'Occupation'} <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            value={selectedOccupation} 
                            onValueChange={handleOccupationSelect}
                          >
                            <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700">
                              <SelectValue placeholder={language === 'bn' ? 'পেশা নির্বাচন করুন' : 'Select occupation'} />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {professionsList.map(prof => (
                                <SelectItem key={prof} value={prof} className="text-xs sm:text-sm">
                                  {prof}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.occupation && (
                            <p className="text-xs text-destructive">{errors.occupation.message}</p>
                          )}

                          {/* Custom Occupation input if 'অন্যান্য' */}
                          {isCustomOccupation && (
                            <div className="pt-1.5 animate-in fade-in slide-in-from-top-1">
                              <Input
                                placeholder={language === 'bn' ? 'আপনার নির্দিষ্ট পেশাটি লিখুন' : 'Specify your occupation'}
                                className="h-9 text-xs rounded-lg"
                                {...register('custom_occupation')}
                              />
                            </div>
                          )}
                        </div>

                        {/* Blood Group */}
                        <div className="space-y-1.5">
                          <Label className="text-xs sm:text-sm font-medium">
                            {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}{' '}
                            <span className="text-muted-foreground text-xs font-normal">
                              ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
                            </span>
                          </Label>
                          <Select onValueChange={(value) => setValue('blood_group', value)}>
                            <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700">
                              <SelectValue
                                placeholder={language === 'bn' ? 'রক্তের গ্রুপ' : 'Select blood group'}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {bloodGroups.map((group) => (
                                <SelectItem key={group} value={group} className="text-xs sm:text-sm">
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3">
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#006a4e] hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-700/25 hover:shadow-emerald-700/40 transition-all hover:scale-[1.005] active:scale-[0.995]" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? (language === 'bn' ? 'আবেদন জমা হচ্ছে...' : 'Submitting Application...')
                          : (language === 'bn' ? 'সদস্য আবেদনপত্র জমা দিন' : 'Submit Application')}
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
