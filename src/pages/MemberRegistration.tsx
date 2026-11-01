import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Upload,
  CheckCircle,
  CheckCircle2,
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
  CreditCard,
  Droplet,
  MapPin,
  Briefcase,
  Home,
  Navigation,
  ArrowRight,
  ArrowLeft,
  CircleDollarSign,
  Heart,
  Copy,
  Check,
  Search,
  Clock,
  BookOpen,
  Sprout,
  RefreshCw,
  Info
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
  willing_to_donate_blood: z.string().default('yes'),
  willing_to_pay_subscription: z.string().default('yes'),
  subscription_frequency: z.string().default('monthly'),
  subscription_amount: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MemberRegistration: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Multi-step State (Step 1: Personal & Address, Step 2: Profession, Blood & Dues)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdMemberId, setCreatedMemberId] = useState<string>('');
  const [createdApplicantName, setCreatedApplicantName] = useState<string>('');
  const [memberType, setMemberType] = useState<'new' | 'existing'>('new');
  const [previousMemberId, setPreviousMemberId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Status Search State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusSearchId, setStatusSearchId] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    found: boolean;
    data?: any;
    message?: string;
  } | null>(null);

  // Cascading Address State
  const [selectedDivision, setSelectedDivision] = useState<string>('রাজশাহী');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('নওগাঁ');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('নওগাঁ সদর');
  const [selectedUnion, setSelectedUnion] = useState<string>('নওগাঁ পৌরসভা');

  // Step 2 Interactive States
  const [selectedOccupation, setSelectedOccupation] = useState<string>('');
  const [isCustomOccupation, setIsCustomOccupation] = useState<boolean>(false);
  const [willingToDonate, setWillingToDonate] = useState<string>('yes');
  const [willingToPayDues, setWillingToPayDues] = useState<string>('yes');
  const [subscriptionFrequency, setSubscriptionFrequency] = useState<string>('monthly');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
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
      willing_to_donate_blood: 'yes',
      willing_to_pay_subscription: 'yes',
      subscription_frequency: 'monthly',
      subscription_amount: '500',
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

  // Adjust suggested amount on frequency switch
  const handleFrequencyChange = (freq: string) => {
    setSubscriptionFrequency(freq);
    setValue('subscription_frequency', freq);

    const defaultAmounts: Record<string, string> = {
      monthly: '500',
      bi_monthly: '1000',
      quarterly: '1500',
      half_yearly: '3000',
      yearly: '6000'
    };
    const currentVal = watch('subscription_amount');
    if (!currentVal || ['500', '1000', '1500', '3000', '6000'].includes(currentVal)) {
      setValue('subscription_amount', defaultAmounts[freq] || '500');
    }
  };

  // Immediate and lightweight compression right upon photo selection
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setOriginalSize(file.size);
      setIsCompressing(true);

      try {
        // Optimized to 350x350 and quality 0.75 for lightning-fast network transfer (~15-20 KB)
        const compressed = await compressImage(file, 350, 350, 0.75);
        setCompressedBlob(compressed);
        setCompressedSize(compressed.size);

        const previewUrl = URL.createObjectURL(compressed);
        setPhotoPreview(previewUrl);

        toast.success(
          language === 'bn'
            ? `ছবি অপ্টিমাইজ সম্পন্ন: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`
            : `Photo optimized: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`
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

  // Step 1 Validation & Next transition
  const handleNextStep = async () => {
    const isStep1Valid = await trigger([
      'full_name',
      'phone',
      'present_address',
      'permanent_division',
      'permanent_district',
      'permanent_upazila',
      'permanent_union'
    ]);

    if (isStep1Valid) {
      setCurrentStep(2);
      window.scrollTo({ top: 180, behavior: 'smooth' });
    } else {
      toast.error(
        language === 'bn'
          ? 'অনুগ্রহ করে ১ম ধাপের লাল তারকা চিহ্নিত আবশ্যক ঘরগুলো পূরণ করুন।'
          : 'Please complete all required fields in Step 1.'
      );
    }
  };

  // 1-Click Copy Member ID
  const handleCopyId = (idToCopy: string) => {
    if (!idToCopy) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(idToCopy);
      } else {
        const el = document.createElement('textarea');
        el.value = idToCopy;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedId(true);
      toast.success(language === 'bn' ? 'সদস্য ট্র্যাকিং আইডি কপি করা হয়েছে!' : 'Member Tracking ID copied!');
      setTimeout(() => setCopiedId(false), 2500);
    } catch {
      toast.error(language === 'bn' ? 'কপি করা যায়নি, অনুগ্রহ করে ম্যানুয়ালি কপি করুন।' : 'Failed to copy');
    }
  };

  // Application Status Check by Member ID
  const handleCheckStatus = async (idToSearch?: string) => {
    const targetId = (idToSearch || statusSearchId).trim();
    if (!targetId) {
      toast.error(language === 'bn' ? 'অনুগ্রহ করে আপনার সদস্য আইডি লিখুন।' : 'Please enter your Member ID.');
      return;
    }
    setStatusLoading(true);
    setStatusResult(null);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('member_id, full_name, status, created_at, phone, occupation, blood_group, subscription_amount, subscription_frequency')
        .ilike('member_id', targetId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStatusResult({ found: true, data });
      } else {
        setStatusResult({
          found: false,
          message: language === 'bn'
            ? 'এই আইডির কোনো আবেদন পাওয়া যায়নি। অনুগ্রহ করে সঠিক আইডি দিয়ে পুনরায় চেষ্টা করুন।'
            : 'No application found with this ID. Please verify and try again.'
        });
      }
    } catch (err: any) {
      console.error('Status check error:', err);
      setStatusResult({
        found: false,
        message: language === 'bn'
          ? 'তথ্য যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।'
          : 'Failed to verify status. Please check your internet connection.'
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Ultra-Fast Submission Routine (< 2 Seconds)
  const onSubmit = async (data: RegistrationFormData) => {
    // Validate occupation on final submit
    if (!data.occupation || data.occupation.trim().length < 2) {
      toast.error(language === 'bn' ? 'অনুগ্রহ করে আপনার পেশা নির্বাচন করুন।' : 'Please select your occupation.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Lightning photo upload with strict 3-second timeout protection
      let photoUrl: string | null = null;
      if (compressedBlob) {
        const fileExt = photoFile?.name.split('.').pop() || 'jpg';
        const fileName = `pending/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        try {
          const uploadOperation = async () => {
            const { error: uploadError } = await supabase.storage
              .from('member-photos')
              .upload(fileName, compressedBlob, {
                contentType: compressedBlob.type || 'image/jpeg',
                upsert: true
              });

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage
                .from('member-photos')
                .getPublicUrl(fileName);
              return publicUrlData?.publicUrl || null;
            }
            return null;
          };

          // Under NO circumstances does photo upload hold the user for 60 seconds
          const timeoutProtection = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
          photoUrl = await Promise.race([uploadOperation(), timeoutProtection]);
        } catch (uploadEx) {
          console.warn('Storage upload non-blocking warning:', uploadEx);
        }
      }

      // 2. Build structured permanent address
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

      const memberIdToUse = memberType === 'existing' && previousMemberId.trim()
        ? previousMemberId.trim()
        : generateMemberId();

      const isDonateYes = data.willing_to_donate_blood === 'yes';
      const isSubYes = data.willing_to_pay_subscription === 'yes';
      const subAmountNum = isSubYes ? parseFloat(data.subscription_amount || '0') || 0 : 0;

      // 3. Fast direct insertion into members table
      const { error: memberError } = await supabase.from('members').insert({
        member_id: memberIdToUse,
        full_name: data.full_name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone.trim(),
        address: combinedAddress,
        present_address: data.present_address.trim(),
        permanent_address: permanentFormatted,
        occupation: finalOccupation,
        blood_group: data.blood_group || null,
        willing_to_donate_blood: isDonateYes,
        willing_to_pay_subscription: isSubYes,
        subscription_frequency: isSubYes ? data.subscription_frequency : 'monthly',
        subscription_amount: subAmountNum,
        photo_url: photoUrl,
        status: 'pending',
        member_type: memberType === 'existing' ? 'renewal' : 'general',
      });

      if (memberError) throw memberError;

      // 4. Asynchronous parallel addition to blood donors pool (non-blocking)
      if (isDonateYes && data.blood_group) {
        supabase.from('blood_donors').insert({
          full_name: data.full_name.trim(),
          phone: data.phone.trim(),
          blood_group: data.blood_group,
          division: selectedDivision,
          district: selectedDistrict,
          upazila: selectedUpazila,
          address: data.present_address.trim(),
          is_public_details: true,
          is_member: true,
          member_id: memberIdToUse,
          status: 'pending',
          notes: `সদস্য আবেদন থেকে যুক্ত (চাঁদা: ${isSubYes ? data.subscription_frequency : 'না'}, পরিমাণ: ${subAmountNum}৳)`
        }).then(() => { }).catch((bErr) => {
          console.warn('Could not auto-add to blood_donors:', bErr);
        });
      }

      // 5. Immediate UI confirmation
      setCreatedMemberId(memberIdToUse);
      setCreatedApplicantName(data.full_name.trim());
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(
        language === 'bn'
          ? 'অভিনন্দন! আপনার সদস্য আবেদন সফলভাবে জমা হয়েছে!'
          : 'Congratulations! Your application has been submitted successfully!'
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(
        language === 'bn'
          ? (error?.message || 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
          : (error?.message || 'Failed to submit application. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // SUCCESS & CONGRATULATION SCREEN (Professional, Inspiring & Detailed)
  // =========================================================================
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 selection:bg-[#0B6B3A] selection:text-white">
        <Navbar />
        <main className="flex-1 py-10 sm:py-16 px-4 bg-gradient-to-b from-[#E6F4EA]/40 via-slate-50 to-emerald-50/20 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900">
          <div className="container mx-auto max-w-4xl">

            {/* Top Congratulation Banner Card */}
            <div className="text-center mb-8 sm:mb-10 animate-in fade-in-up duration-500">

              {/* Signature Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] shadow-xs mb-4">
                <span className="w-5 h-5 rounded-full bg-[#0B6B3A] flex items-center justify-center text-white flex-shrink-0">
                  <Sprout className="w-3.5 h-3.5" />
                </span>
                <span className="text-[#0B6B3A] text-xs sm:text-sm font-bold tracking-wide">
                  {language === 'bn' ? 'সময়ের বাতিঘর • নতুন সদস্য আবেদন' : 'Somoyer Batighor • Membership Application'}
                </span>
              </div>

              {/* Two-Tone Title with Brush Underline */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold font-heading text-[#14231B] dark:text-slate-100 tracking-tight leading-tight">
                <span>{language === 'bn' ? 'অভিনন্দন! ' : 'Congratulations! '}</span>
                <span className="text-[#0B6B3A] relative inline-block">
                  {createdApplicantName || (language === 'bn' ? 'সম্মানিত সদস্য' : 'Respected Member')}
                  <svg
                    className="absolute -bottom-2 md:-bottom-2.5 left-0 w-full h-3 md:h-3.5 text-[#9BD038] pointer-events-none"
                    viewBox="0 0 240 14"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M3 10C52 4 172 3 237 8C194 12.2 88 12 3 10Z" fill="currentColor" opacity="0.95" />
                  </svg>
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                {language === 'bn'
                  ? 'মানবিক ও সামাজিক পরিবর্তনের আলোকবর্তিকা "সময়ের বাতিঘর" পরিবারে আপনাকে আন্তরিক স্বাগতম। আপনার আন্তরিক অংশগ্রহণ আমাদের সমাজকল্যাণের পথচলাকে আরও সমৃদ্ধ করবে।'
                  : 'Welcome to the Somoyer Batighor family. Your participation strengthens our journey toward social welfare and community empowerment.'}
              </p>
            </div>

            {/* Member ID Card with 1-Click Copy and Verification Status */}
            <div className="mb-8 p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-white via-emerald-50/40 to-white dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border-2 border-emerald-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.06)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-400">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0B6B3A] to-[#11DFC0] flex items-center justify-center text-white shadow-lg shadow-[#0B6B3A]/25 shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {language === 'bn' ? 'আপনার অফিসিয়াল সদস্য আবেদন আইডি' : 'Official Member Application ID'}
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0B6B3A] dark:text-emerald-300 tracking-wider">
                        {createdMemberId}
                      </span>
                      <Button
                        type="button"
                        onClick={() => handleCopyId(createdMemberId)}
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-xl border-emerald-300 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 font-semibold gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        {copiedId ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>{language === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-emerald-600" />
                            <span>{language === 'bn' ? 'আইডি কপি করুন' : 'Copy ID'}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-xs">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>{language === 'bn' ? 'আবেদনের অবস্থা: প্রাথমিক পর্যালোচনাধীন' : 'Status: Under Initial Review'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  {language === 'bn'
                    ? 'এই আইডিটি সংরক্ষণ করুন; ভবিষ্যতে আবেদনের অবস্থান জানতে ও পোর্টালে লগইন করতে এটি প্রয়োজন হবে।'
                    : 'Save this Tracking ID to check status and log in to the portal in future.'}
                </span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                  {language === 'bn' ? 'তারিখ:' : 'Date:'} {new Date().toLocaleDateString('bn-BD')}
                </span>
              </div>
            </div>

            {/* Comprehensive Information Grid: 3 Inspiring Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

              {/* Card 1: কার সাথে যুক্ত হলেন? */}
              <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0B6B3A] dark:text-emerald-300 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100 mb-2">
                    {language === 'bn' ? 'কার সাথে যুক্ত হলেন?' : 'Who Did You Join?'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {language === 'bn'
                      ? 'আপনি যুক্ত হলেন নওগাঁর সীমান্তবর্তী সাপাহার উপজেলার একটি প্রতিশ্রুতিশীল ও নিবেদিতপ্রাণ স্বেচ্ছাসেবী সংগঠন "সময়ের বাতিঘর"-এর সঙ্গে। যেখানে প্রতিটি সদস্য নিঃস্বার্থ সমাজসেবা ও মানবকল্যাণের ব্রত নিয়ে একসাথে কাজ করে।'
                      : 'You joined Somoyer Batighor, a dedicated voluntary organization in Sapahar, Naogaon, working tirelessly for humanity.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-[#0B6B3A] dark:text-emerald-400">
                  {language === 'bn' ? '✓ ঐক্য, সেবা ও মানবিক পরিবর্তনের অঙ্গীকার' : '✓ Unity, Service & Integrity'}
                </div>
              </div>

              {/* Card 2: মানুষের কী কী উপকার হবে আপনার মাধ্যমে? */}
              <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100 mb-2">
                    {language === 'bn' ? 'মানুষের কী উপকার হবে?' : 'Impact on Society'}
                  </h3>
                  <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <Droplet className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'মুমূর্ষু রোগীর জরুরি রক্ত সরবরাহ ও জীবন রক্ষা' : 'Emergency blood for critical patients'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'অসহায় পরিবারে খাদ্য, বস্ত্র ও ত্রাণ সহায়তা' : 'Relief & food for vulnerable families'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'মেধাবী ও অসচ্ছল শিক্ষার্থীদের শিক্ষাবৃত্তি' : 'Scholarships for deserving students'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sprout className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'বৃক্ষরোপণ ও এলাকার পরিবেশ সুরক্ষা' : 'Tree plantation and environmental care'}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-[#0B6B3A] dark:text-emerald-400">
                  {language === 'bn' ? '✓ প্রতিটি দানে সুবিধাবঞ্চিতদের মুখে হাসি' : '✓ Every gift brings a smile'}
                </div>
              </div>

              {/* Card 3: সদস্য হিসেবে আপনি কী সুবিধা পাবেন? */}
              <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 flex items-center justify-center mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100 mb-2">
                    {language === 'bn' ? 'আপনি নিজে কী সুবিধা পাবেন?' : 'Your Member Privileges'}
                  </h3>
                  <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'ইউনিক ডিজিটাল মেম্বার আইডি ও স্বীকৃতি' : 'Official Digital Member ID card'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Vote className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'বার্ষিক সাধারণ সভায় (AGM) ভোটাধিকার' : 'Voting rights in annual assemblies'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Droplet className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'পরিবারের প্রয়োজনে রক্ত ও চিকিৎসায় অগ্রাধিকার' : 'Priority medical & blood support'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Receipt className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{language === 'bn' ? 'ডিজিটাল রসিদ ও স্বচ্ছ আর্থিক হিসাব দেখা' : 'Digital receipts and audit visibility'}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-[#0B6B3A] dark:text-emerald-400">
                  {language === 'bn' ? '✓ আনুষ্ঠানিক মেম্বারশিপ সার্টিফিকেট ও সম্মাননা' : '✓ Formal Certificate & Honors'}
                </div>
              </div>

            </div>

            {/* Realtime Status Checking Tool Inline Card */}
            <div className="p-6 sm:p-7 rounded-[24px] bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.05)] mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#0B6B3A]" />
                    <span>{language === 'bn' ? 'আবেদনের বর্তমান অবস্থান যাচাই করুন' : 'Check Application Live Status'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'bn'
                      ? 'আপনার বা যেকোনো সদস্য আবেদন আইডি দিয়ে বর্তমান অনুমোদন অবস্থা জেনে নিন।'
                      : 'Check real-time application and membership status with tracking ID.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder={language === 'bn' ? 'সদস্য আইডি লিখুন (উদা: SB-2026-XXXX)' : 'Enter ID (e.g. SB-2026-XXXX)'}
                    value={statusSearchId || createdMemberId}
                    onChange={(e) => setStatusSearchId(e.target.value)}
                    className="h-10 text-sm font-mono rounded-xl border-slate-300 dark:border-slate-700 w-full sm:w-64"
                  />
                  <Button
                    type="button"
                    onClick={() => handleCheckStatus(statusSearchId || createdMemberId)}
                    disabled={statusLoading}
                    className="h-10 px-4 rounded-xl bg-[#0B6B3A] hover:bg-[#084D29] text-white font-semibold gap-1.5 shadow-sm"
                  >
                    {statusLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{language === 'bn' ? 'যাচাই করুন' : 'Check'}</span>
                  </Button>
                </div>
              </div>

              {/* Live Status Result Display */}
              {statusResult && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
                  {statusResult.found && statusResult.data ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {statusResult.data.full_name}
                          </span>
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {statusResult.data.member_id}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusResult.data.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : statusResult.data.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                          {statusResult.data.status === 'approved'
                            ? (language === 'bn' ? '✓ অনুমোদিত সদস্য' : 'Approved Member')
                            : statusResult.data.status === 'pending'
                              ? (language === 'bn' ? '⏳ পর্যালোচনাধীন (Pending)' : 'Under Review')
                              : (language === 'bn' ? 'বাতিল' : 'Rejected')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block">{language === 'bn' ? 'পেশা:' : 'Occupation:'}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{statusResult.data.occupation || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{language === 'bn' ? 'রক্তের গ্রুপ:' : 'Blood Group:'}</span>
                          <span className="font-semibold text-rose-600">{statusResult.data.blood_group || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{language === 'bn' ? 'প্রতিশ্রুত চাঁদা:' : 'Dues Pledge:'}</span>
                          <span className="font-semibold text-emerald-700">৳{statusResult.data.subscription_amount || '0'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{language === 'bn' ? 'আবেদনের তারিখ:' : 'Applied Date:'}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(statusResult.data.created_at).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                        {statusResult.data.status === 'approved'
                          ? (language === 'bn' ? 'আপনার আবেদনটি কেন্দ্রীয় পরিষদ কর্তৃক চূড়ান্তভাবে অনুমোদিত হয়েছে। সদস্য পোর্টালে লগইন করতে পারেন।' : 'Your application has been formally approved.')
                          : (language === 'bn' ? 'আপনার আবেদনটি কেন্দ্রীয় কার্যনির্বাহী পরিষদের অনুমোদনের অপেক্ষায় রয়েছে। খুব শীঘ্রই আপনার মোবাইল নম্বরে নিশ্চিতকরণ বার্তা পাঠানো হবে।' : 'Your application is awaiting central executive approval.')}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-600 font-medium flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>{statusResult.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#006a4e] hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-lg shadow-emerald-700/25 transition-all gap-2"
              >
                <Home className="w-4 h-4" />
                <span>{language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Go to Homepage'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/members')}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'সদস্য তালিকা ও অনুসন্ধান' : 'Members Directory'}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setIsSuccess(false);
                  setCurrentStep(1);
                  setCreatedMemberId('');
                  setPhotoFile(null);
                  setCompressedBlob(null);
                  setPhotoPreview(null);
                }}
                className="w-full sm:w-auto h-12 px-6 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                {language === 'bn' ? 'আরেকটি নতুন আবেদন করুন' : 'Submit Another Application'}
              </Button>
            </div>

          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // =========================================================================
  // MAIN REGISTRATION FORM VIEW
  // =========================================================================
  const memberBenefits = [
    {
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-600',
      titleBn: 'ডিজিটাল মেম্বার আইডি কার্ড',
      titleEn: 'Digital Member ID Card',
      descBn: 'সংগঠনের অফিসিয়াল ইউনিক মেম্বার আইডি ও ডিজিটাল আইডি কার্ড প্রাপ্তি।',
      descEn: 'Official unique Member ID and instant digital identity verification.'
    },
    {
      icon: Droplet,
      color: 'from-rose-500 to-red-600',
      titleBn: 'জরুরি রক্তদান ও চিকিৎসা সেবায় অগ্রাধিকার',
      titleEn: 'Priority in Blood & Medical Aid',
      descBn: 'আপনার বা পরিবারের প্রয়োজনে সংগঠনের রক্তদাতা নেটওয়ার্ক ও সেবায় সর্বোচ্চ অগ্রাধিকার।',
      descEn: 'Top priority access to volunteer blood donors and community emergency support.'
    },
    {
      icon: Receipt,
      color: 'from-amber-500 to-orange-600',
      titleBn: 'স্বচ্ছ ডিজিটাল চাঁদা ও রসিদ',
      titleEn: 'Transparent Dues & Receipts',
      descBn: 'অনলাইনে চাঁদা পরিশোধ, তাত্ক্ষণিক ডিজিটাল রসিদ ও সংগঠনের বাৎসরিক আয়-ব্যয়ের অডিট দেখার সুবিধা।',
      descEn: 'Online dues tracking, verified PDF receipts, and access to yearly audit reports.'
    },
    {
      icon: Vote,
      color: 'from-purple-500 to-violet-600',
      titleBn: 'সাংগঠনিক সিদ্ধান্তে ভোটাধিকার',
      titleEn: 'Voting Rights in General Assembly',
      descBn: 'বার্ষিক সাধারণ সভা (AGM)-এ অংশ নিয়ে নেতৃত্ব নির্বাচন ও কার্যক্রমে মতামত প্রকাশ।',
      descEn: 'Participate and vote in annual assemblies to shape key organizational decisions.'
    },
    {
      icon: HeartHandshake,
      color: 'from-emerald-500 to-teal-600',
      titleBn: 'মানবিক ও সামাজিক প্রকল্পে নেতৃত্ব',
      titleEn: 'Leadership in Community Projects',
      descBn: 'ত্রাণ, বৃক্ষরোপণ, শিক্ষাবৃত্তি ও সুবিধাবঞ্চিত শিশুদের কল্যাণে সরাসরি সম্পৃক্ত হওয়ার সুযোগ।',
      descEn: 'Lead and execute relief, tree plantation, scholarships, and social welfare programs.'
    },
    {
      icon: Award,
      color: 'from-teal-500 to-cyan-600',
      titleBn: 'বার্ষিক সম্মাননা ও সার্টিফিকেট',
      titleEn: 'Annual Honors & Certificate',
      descBn: 'সেবামূলক কাজের স্বীকৃতি হিসেবে আনুষ্ঠানিক মেম্বারশিপ সার্টিফিকেট ও বার্ষিক সম্মাননা।',
      descEn: 'Formal certificates of appreciation and awards recognizing community contributions.'
    }
  ];

  const quickAmounts = subscriptionFrequency === 'monthly'
    ? ['২০০', '৩০০', '৫০০', '১০০০']
    : subscriptionFrequency === 'bi_monthly'
      ? ['৫০০', '১০০০', '১৫০০', '২০০০']
      : subscriptionFrequency === 'quarterly'
        ? ['১০০০', '১৫০০', '২০০০', '৩০০০']
        : subscriptionFrequency === 'half_yearly'
          ? ['১৫০০', '৩০০০', '৫০০০', '১০০০০']
          : ['৩০০০', '৬০০০', '১০০০০', '২০০০'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 selection:bg-[#0B6B3A] selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-b from-emerald-900 via-[#0B6B3A] to-[#084D29] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs sm:text-sm font-medium mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>{language === 'bn' ? 'সময়ের বাতিঘর পরিবারে আপনাকে স্বাগতম' : 'Welcome to Somoyer Batighor'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold tracking-tight mb-4 leading-tight">
            {language === 'bn' ? 'সদস্য হওয়ার জন্য আবেদন' : 'Membership Application'}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            {language === 'bn'
              ? 'নিচের সহজ ফর্মটি পূরণ করে দ্রুততম সময়ে আমাদের বৃহৎ সমাজসেবামূলক পরিবারে যুক্ত হোন।'
              : 'Complete the form below to become an active accredited member of Somoyer Batighor.'}
          </p>

          {/* Quick Status Lookup Banner Button */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowStatusModal(!showStatusModal)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <Search className="w-4 h-4 text-emerald-200" />
              <span>{language === 'bn' ? 'ইতিপূর্বে আবেদন করেছেন? আবেদনের অবস্থান জানুন' : 'Already applied? Check your status'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-10 sm:py-14 px-4 bg-gradient-to-b from-slate-100/60 to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto max-w-6xl">

          {/* Collapsible Status Search Banner (If clicked) */}
          {showStatusModal && (
            <div className="mb-8 p-6 rounded-[24px] bg-white dark:bg-slate-900 border-2 border-emerald-500/30 shadow-xl animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base sm:text-lg font-bold font-heading text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#0B6B3A]" />
                    <span>{language === 'bn' ? 'সদস্য আবেদনের বর্তমান অবস্থা অনুসন্ধান' : 'Search Member Application Status'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕ {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder={language === 'bn' ? 'আপনার আবেদন ট্র্যাকিং আইডি লিখুন (যেমন: SB-2026-1234)' : 'Enter tracking ID (e.g. SB-2026-1234)'}
                    value={statusSearchId}
                    onChange={(e) => setStatusSearchId(e.target.value)}
                    className="h-11 rounded-xl font-mono text-sm border-slate-300 dark:border-slate-700"
                  />
                  <Button
                    type="button"
                    onClick={() => handleCheckStatus()}
                    disabled={statusLoading}
                    className="h-11 px-6 rounded-xl bg-[#0B6B3A] hover:bg-[#084D29] text-white font-bold shrink-0 gap-2"
                  >
                    {statusLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>{language === 'bn' ? 'অবস্থা দেখুন' : 'Check Status'}</span>
                  </Button>
                </div>

                {statusResult && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    {statusResult.found && statusResult.data ? (
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 dark:text-slate-100 font-bold text-base">
                            {statusResult.data.full_name}
                          </strong>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {statusResult.data.member_id}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          {language === 'bn' ? 'বর্তমান অবস্থা:' : 'Current Status:'}{' '}
                          <span className={`font-bold ${statusResult.data.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {statusResult.data.status === 'approved' ? '✓ অনুমোদিত সদস্য' : '⏳ পর্যালোচনাধীন (Pending)'}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-600 font-medium">{statusResult.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Benefits & Trust badges */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-[24px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.06)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {language === 'bn' ? 'সদস্য সুবিধার বিবরণ' : 'Membership Benefits'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {language === 'bn' ? '৬টি বিশেষ সুবিধা' : '6 Special Privileges'}
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
                <div className="space-y-3 pt-1">
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0B6B3A] to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
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

              {/* Verification Note */}
              <div className="px-5 py-4 rounded-[20px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="leading-relaxed">
                  {language === 'bn'
                    ? 'আপনার আবেদন জমা হওয়ার পর কেন্দ্রীয় কার্যনির্বাহী পরিষদ কর্তৃক যাচাই শেষে সদস্যপদ চূড়ান্ত করা হয়।'
                    : 'Applications are verified and approved by the central executive council.'}
                </span>
              </div>
            </div>

            {/* Right Column: Step Form */}
            <div className="lg:col-span-7 w-full">
              <Card className="shadow-[0_10px_35px_rgba(0,0,0,0.06)] border-2 border-emerald-500/30 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[24px]">
                <CardHeader className="text-center pb-5 pt-7 px-6 bg-gradient-to-r from-emerald-100/40 via-teal-50/30 to-emerald-100/40 dark:from-emerald-950/40 dark:to-slate-900 border-b border-emerald-100/70 dark:border-slate-800">
                  <div className="w-14 h-14 bg-gradient-to-tr from-[#0B6B3A] via-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#0B6B3A]/25 text-white">
                    <Users className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? 'সদস্য আবেদন ফর্ম' : 'Membership Application Form'}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'পর্যায়ক্রমে ২টি ধাপে সঠিক তথ্য দিয়ে আবেদনপত্রটি সম্পন্ন করুন'
                      : 'Please complete the application across 2 quick steps'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 px-5 sm:px-8 pb-8">
                  {/* Step Tracker Indicator */}
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className={`flex items-center gap-2.5 transition-all text-left ${currentStep === 1 ? 'text-[#0B6B3A] dark:text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${currentStep === 1 ? 'bg-[#0B6B3A] text-white shadow-md shadow-[#0B6B3A]/25 scale-105' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60'}`}>
                        {currentStep === 2 ? '✓' : '১'}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold leading-tight">
                          {language === 'bn' ? '১. ব্যক্তিগত ও ঠিকানা' : '1. Personal & Address'}
                        </p>
                        <p className="text-[10px] text-slate-400 hidden sm:block">
                          {currentStep === 1 ? (language === 'bn' ? 'চলমান ধাপ' : 'In Progress') : (language === 'bn' ? 'সম্পূর্ণ হয়েছে' : 'Completed')}
                        </p>
                      </div>
                    </button>

                    <div className="flex-1 mx-3 sm:mx-6 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r from-[#0B6B3A] to-[#11DFC0] transition-all duration-300 ${currentStep === 1 ? 'w-1/2' : 'w-full'}`} />
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (currentStep === 1) await handleNextStep();
                      }}
                      className={`flex items-center gap-2.5 transition-all text-left ${currentStep === 2 ? 'text-[#0B6B3A] dark:text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${currentStep === 2 ? 'bg-[#0B6B3A] text-white shadow-md shadow-[#0B6B3A]/25 scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        ২
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold leading-tight">
                          {language === 'bn' ? '২. পেশা, রক্ত ও চাঁদা' : '2. Profession, Blood & Dues'}
                        </p>
                        <p className="text-[10px] text-slate-400 hidden sm:block">
                          {currentStep === 2 ? (language === 'bn' ? 'চূড়ান্ত ধাপ' : 'Final Step') : (language === 'bn' ? 'পরবর্তী ধাপ' : 'Next Step')}
                        </p>
                      </div>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* ==================================================== */}
                    {/* STEP 1: Personal Information & Address Details       */}
                    {/* ==================================================== */}
                    {currentStep === 1 && (
                      <div className="space-y-6 animate-in fade-in duration-200">

                        {/* Photo Upload with auto compression */}
                        <div className="flex flex-col items-center p-5 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <div className="relative w-28 h-28 mb-3">
                            {isCompressing ? (
                              <div className="w-full h-full rounded-full border-4 border-emerald-500/40 flex items-center justify-center bg-muted animate-pulse">
                                <ImageIcon className="w-10 h-10 text-emerald-600/50" />
                              </div>
                            ) : photoPreview ? (
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-full border-4 border-[#0B6B3A] shadow-md"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full border-4 border-dashed border-emerald-600/40 flex items-center justify-center bg-emerald-50/60 dark:bg-emerald-950/40">
                                <Users className="w-10 h-10 text-[#0B6B3A]/60 dark:text-emerald-400/60" />
                              </div>
                            )}
                          </div>

                          {compressedSize > 0 && originalSize > 0 && (
                            <div className="text-[11px] text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full mb-2 font-medium">
                              {language === 'bn' ? 'অপ্টিমাইজড:' : 'Optimized:'} {formatFileSize(originalSize)} → {formatFileSize(compressedSize)}
                              {' '}({Math.round((1 - compressedSize / originalSize) * 100)}% {language === 'bn' ? 'কম' : 'smaller'})
                            </div>
                          )}

                          <Label
                            htmlFor="photo"
                            className="cursor-pointer inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0B6B3A] hover:text-emerald-800 bg-[#E6F4EA] hover:bg-emerald-200/80 border border-[#C8E6C9] px-4 py-2 rounded-full transition-colors shadow-xs"
                          >
                            <Upload className="w-4 h-4" />
                            {isCompressing
                              ? (language === 'bn' ? 'প্রসেসিং হচ্ছে...' : 'Compressing...')
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
                            {language === 'bn' ? '(ঐচ্ছিক - ছবি স্বয়ংক্রিয়ভাবে দ্রুততম লোডিংয়ের জন্য অপ্টিমাইজ হবে)' : '(Optional - auto compressed for fast submission)'}
                          </p>
                        </div>

                        {/* Membership Category */}
                        <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
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
                                <UserPlus className="w-4 h-4 text-[#0B6B3A]" />
                                {language === 'bn' ? 'নতুন সদস্য আবেদন' : 'New Membership'}
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="existing" id="existing-member" />
                              <Label htmlFor="existing-member" className="flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm font-medium">
                                <UserCheck className="w-4 h-4 text-[#0B6B3A]" />
                                {language === 'bn' ? 'পূর্ববর্তী সদস্য নবায়ন' : 'Existing Member Renewal'}
                              </Label>
                            </div>
                          </RadioGroup>

                          {memberType === 'existing' && (
                            <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                              <Label htmlFor="previous_member_id" className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                                {language === 'bn' ? 'আগের সদস্য আইডি (জানা থাকলে লিখুন)' : 'Previous Member ID (if known)'}
                              </Label>
                              <Input
                                id="previous_member_id"
                                placeholder={language === 'bn' ? 'যেমন: SB-2023-1234' : 'e.g., SB-2023-1234'}
                                value={previousMemberId}
                                onChange={(e) => setPreviousMemberId(e.target.value)}
                                className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700"
                              />
                            </div>
                          )}
                        </div>

                        {/* SECTION: Personal Information */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                            <Users className="w-4 h-4 text-[#0B6B3A]" />
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
                              className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A] focus:ring-[#0B6B3A]"
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
                                className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A] focus:ring-[#0B6B3A]"
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
                                className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A] focus:ring-[#0B6B3A]"
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
                            <MapPin className="w-4 h-4 text-[#0B6B3A]" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {language === 'bn' ? 'ঠিকানা সংক্রান্ত তথ্য' : 'Address Details'}
                            </h4>
                          </div>

                          {/* Present Address */}
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
                              className="text-sm resize-none rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A] focus:ring-[#0B6B3A]"
                              {...register('present_address')}
                            />
                            {errors.present_address && (
                              <p className="text-xs text-destructive">{errors.present_address.message}</p>
                            )}
                          </div>

                          {/* Permanent Address */}
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                <Navigation className="w-3.5 h-3.5 text-[#0B6B3A]" />
                                <span>{language === 'bn' ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</span>
                                <span className="text-red-500">*</span>
                              </Label>
                              <span className="text-[11px] font-semibold text-[#0B6B3A] dark:text-emerald-400 bg-[#E6F4EA] dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-[#C8E6C9]">
                                {language === 'bn' ? 'সমগ্র বাংলাদেশ' : 'All Bangladesh'}
                              </span>
                            </div>

                            {/* 4-Dropdowns Grid: Division, District, Upazila, Union */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                              {/* 1. Division */}
                              <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {language === 'bn' ? 'স্থায়ী বিভাগ' : 'Division'} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                                  <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]">
                                    <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {divisions.map(div => (
                                      <SelectItem key={div} value={div} className="text-sm">
                                        {div}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* 2. District */}
                              <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {language === 'bn' ? 'স্থায়ী জেলা' : 'District'} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                                  <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]">
                                    <SelectValue placeholder="জেলা নির্বাচন করুন" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {currentDistricts.map(dist => (
                                      <SelectItem key={dist} value={dist} className="text-sm">
                                        {dist}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* 3. Upazila */}
                              <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {language === 'bn' ? 'উপজেলা / থানা' : 'Upazila'} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedUpazila} onValueChange={handleUpazilaChange}>
                                  <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]">
                                    <SelectValue placeholder="উপজেলা নির্বাচন করুন" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {currentUpazilas.map(upz => (
                                      <SelectItem key={upz} value={upz} className="text-sm">
                                        {upz}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* 4. Union */}
                              <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {language === 'bn' ? 'ইউনিয়ন / পৌরসভা' : 'Union / Ward'} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedUnion} onValueChange={handleUnionChange}>
                                  <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]">
                                    <SelectValue placeholder="ইউনিয়ন নির্বাচন করুন" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {currentUnions.map(un => (
                                      <SelectItem key={un} value={un} className="text-sm">
                                        {un}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                            </div>

                            {/* Village / Road detail */}
                            <div className="space-y-1.5 pt-1">
                              <Label htmlFor="permanent_village" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                {language === 'bn' ? 'গ্রাম / রাস্তা / হোল্ডিং নং' : 'Village / Area / Street'}
                              </Label>
                              <Input
                                id="permanent_village"
                                placeholder={language === 'bn' ? 'যেমন: চকদেব, খাঁসপাড়া, রোড নং ৩, হোল্ডিং ১২/বি' : 'e.g. Village / Area details'}
                                className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]"
                                {...register('permanent_village')}
                              />
                            </div>

                            {/* Live Address Preview Pill (Signature emerald pill style) */}
                            <div className="p-3 rounded-xl bg-[#E6F4EA] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/60 text-xs text-[#0B6B3A] dark:text-emerald-200 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-[#0B6B3A] shrink-0" />
                              <span className="leading-relaxed">
                                {language === 'bn' ? 'নির্বাচিত স্থায়ী ঠিকানা:' : 'Selected Permanent Address:'}{' '}
                                <strong className="font-bold text-[#14231B] dark:text-white">
                                  {[watch('permanent_village')?.trim(), selectedUnion, selectedUpazila, selectedDistrict, selectedDivision].filter(Boolean).join(', ')}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Step 1 Continue Button */}
                        <div className="pt-4">
                          <Button
                            type="button"
                            onClick={handleNextStep}
                            className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#006a4e] hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-700/25 hover:shadow-emerald-700/40 transition-all flex items-center justify-center gap-2 hover:scale-[1.005] active:scale-[0.995]"
                          >
                            <span>{language === 'bn' ? 'পরবর্তী ধাপে যান (পেশা, রক্ত ও চাঁদা)' : 'Continue to Next Step'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>

                      </div>
                    )}

                    {/* ==================================================== */}
                    {/* STEP 2: Profession, Blood Group & Dues Management   */}
                    {/* Exact Same Design Structure as Step 1 (Consistent) */}
                    {/* ==================================================== */}
                    {currentStep === 2 && (
                      <div className="space-y-6 animate-in fade-in duration-200">

                        {/* 1. SECTION: Profession Details */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                            <Briefcase className="w-4 h-4 text-[#0B6B3A]" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {language === 'bn' ? 'পেশাগত বিবরণ' : 'Professional Details'}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Profession Dropdown */}
                            <div className="space-y-1.5">
                              <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                {language === 'bn' ? 'পেশা নির্বাচন করুন' : 'Select Occupation'} <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={selectedOccupation}
                                onValueChange={handleOccupationSelect}
                              >
                                <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]">
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
                            </div>

                            {/* Custom Occupation input if 'অন্যান্য' */}
                            <div className="space-y-1.5">
                              <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                {language === 'bn' ? 'সুনির্দিষ্ট পদবি বা বিবরণ' : 'Designation / Work Details'}{' '}
                                <span className="text-muted-foreground text-xs font-normal">
                                  ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
                                </span>
                              </Label>
                              <Input
                                placeholder={
                                  isCustomOccupation
                                    ? (language === 'bn' ? 'আপনার সুনির্দিষ্ট পেশাটি লিখুন *' : 'Specify your occupation *')
                                    : (language === 'bn' ? 'যেমন: শিক্ষক, কর্মকর্তা, ব্যবসায়ী ইত্যাদি' : 'e.g. Teacher, Officer, Business')
                                }
                                className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]"
                                {...register('custom_occupation')}
                              />
                            </div>

                          </div>
                        </div>

                        {/* 2. SECTION: Blood Group & Emergency Donor Program */}
                        <div className="space-y-4 pt-1">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                            <Droplet className="w-4 h-4 text-[#0B6B3A]" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {language === 'bn' ? 'রক্তের গ্রুপ ও জরুরি রক্তদান কর্মসূচি' : 'Blood Group & Emergency Donor Pool'}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Blood Group */}
                            <div className="space-y-1.5">
                              <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Heart className="w-3.5 h-3.5 text-rose-500" />
                                <span>{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</span>
                                <span className="text-muted-foreground text-xs font-normal">
                                  ({language === 'bn' ? 'জানা থাকলে নির্বাচন করুন' : 'If known'})
                                </span>
                              </Label>
                              <Select onValueChange={(value) => setValue('blood_group', value)}>
                                <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]">
                                  <SelectValue
                                    placeholder={language === 'bn' ? 'রক্তের গ্রুপ নির্বাচন করুন' : 'Select blood group'}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {bloodGroups.map((group) => (
                                    <SelectItem key={group} value={group} className="text-xs sm:text-sm font-semibold">
                                      {group}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Willingness to Join Emergency Blood Donor Program */}
                            <div className="space-y-1.5">
                              <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                {language === 'bn' ? 'জরুরি রক্তদান কর্মসূচিতে সম্পৃক্ততা' : 'Join Blood Donor Pool?'} <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={willingToDonate}
                                onValueChange={(val) => {
                                  setWillingToDonate(val);
                                  setValue('willing_to_donate_blood', val);
                                }}
                              >
                                <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]">
                                  <SelectValue placeholder="নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes" className="text-sm">
                                    {language === 'bn' ? 'হ্যাঁ, আমি রক্তদান কর্মসূচিতে যুক্ত হতে ইচ্ছুক' : 'Yes, I want to join donor pool'}
                                  </SelectItem>
                                  <SelectItem value="no" className="text-sm">
                                    {language === 'bn' ? 'না, এই মুহূর্তে ইচ্ছুক নই' : 'No, not at this moment'}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                          </div>

                          {/* Matching Step 1's Soft Emerald Information Pill */}
                          {willingToDonate === 'yes' && (
                            <div className="p-3 rounded-xl bg-[#E6F4EA] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/60 text-xs text-[#0B6B3A] dark:text-emerald-200 flex items-center gap-2.5 animate-in fade-in duration-200">
                              <CheckCircle className="w-4 h-4 text-[#0B6B3A] shrink-0" />
                              <span className="leading-relaxed">
                                {language === 'bn'
                                  ? 'ধন্যবাদ! আপনার সম্মতিটি প্রশংসনীয়। মুমূর্ষু রোগীর জীবন বাঁচাতে জরুরি প্রয়োজনে আপনার এলাকার মানবিক রক্তদাতা তালিকায় আপনার নাম অন্তর্ভুক্ত থাকবে।'
                                  : 'Thank you! You will be linked with our emergency voluntary blood donation network for patients in need.'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 3. SECTION: Membership Dues & Contribution Pledge */}
                        <div className="space-y-4 pt-1">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                            <CircleDollarSign className="w-4 h-4 text-[#0B6B3A]" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {language === 'bn' ? 'সদস্য চাঁদা ও উন্নয়ন অনুদান অঙ্গীকার' : 'Membership Dues & Development Pledge'}
                            </h4>
                          </div>

                          {/* Willing to pay dues dropdown */}
                          <div className="space-y-1.5">
                            <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                              {language === 'bn' ? 'সংগঠনের মানবিক কার্যক্রমে নিয়মিত চাঁদা প্রদান করতে ইচ্ছুক?' : 'Willing to contribute regular membership dues?'} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={willingToPayDues}
                              onValueChange={(val) => {
                                setWillingToPayDues(val);
                                setValue('willing_to_pay_subscription', val);
                              }}
                            >
                              <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]">
                                <SelectValue placeholder="নির্বাচন করুন" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes" className="text-sm">
                                  {language === 'bn' ? 'হ্যাঁ, আমি সংগঠনের নিয়মিত চাঁদা প্রদান করতে ইচ্ছুক' : 'Yes, I am willing to contribute dues'}
                                </SelectItem>
                                <SelectItem value="no" className="text-sm">
                                  {language === 'bn' ? 'না, আপাতত ইচ্ছুক নই' : 'No, not at this time'}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Frequency & Dynamic Amount Grid (Clean, Matching Step 1) */}
                          {willingToPayDues === 'yes' && (
                            <div className="space-y-4 pt-1 animate-in fade-in duration-200">

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {/* Frequency Selector */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {language === 'bn' ? 'চাঁদা প্রদানের সময়কাল' : 'Payment Frequency'} <span className="text-red-500">*</span>
                                  </Label>
                                  <Select
                                    value={subscriptionFrequency}
                                    onValueChange={handleFrequencyChange}
                                  >
                                    <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A]">
                                      <SelectValue placeholder="সময়কাল" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="monthly" className="text-sm">
                                        {language === 'bn' ? 'মাসিক (প্রতি মাসে)' : 'Monthly'}
                                      </SelectItem>
                                      <SelectItem value="bi_monthly" className="text-sm">
                                        {language === 'bn' ? 'দ্বিমাসিক (প্রতি ২ মাসে)' : 'Bi-Monthly'}
                                      </SelectItem>
                                      <SelectItem value="quarterly" className="text-sm">
                                        {language === 'bn' ? 'ত্রৈমাসিক (প্রতি ৩ মাসে)' : 'Quarterly'}
                                      </SelectItem>
                                      <SelectItem value="half_yearly" className="text-sm">
                                        {language === 'bn' ? 'ষান্মাসিক (প্রতি ৬ মাসে)' : 'Half-Yearly'}
                                      </SelectItem>
                                      <SelectItem value="yearly" className="text-sm">
                                        {language === 'bn' ? 'বাৎসরিক (বছরে একবার)' : 'Yearly'}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Amount Field */}
                                <div className="space-y-1.5">
                                  <Label htmlFor="subscription_amount" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {language === 'bn' ? 'চাঁদার পরিমাণ (টাকা)' : 'Dues Amount (BDT)'} <span className="text-red-500">*</span>
                                  </Label>
                                  <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                                      ৳
                                    </span>
                                    <Input
                                      id="subscription_amount"
                                      type="number"
                                      min="50"
                                      step="50"
                                      placeholder={language === 'bn' ? 'টাকার পরিমাণ লিখুন' : 'Enter amount'}
                                      className="pl-8 h-10 text-sm font-semibold rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#0B6B3A] focus:ring-[#0B6B3A]"
                                      {...register('subscription_amount')}
                                    />
                                  </div>
                                </div>

                              </div>

                              {/* Quick Selection Pills */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <span className="text-[11px] text-slate-400">
                                  {language === 'bn' ? 'সহজ নির্বাচন:' : 'Quick Select:'}
                                </span>
                                {quickAmounts.map((amt) => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setValue('subscription_amount', amt)}
                                    className="px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0B6B3A] hover:text-[#0B6B3A] transition-colors shadow-2xs"
                                  >
                                    ৳{amt}
                                  </button>
                                ))}
                              </div>

                              {/* Live Plan Preview Pill matching Step 1's signature style */}
                              <div className="p-3 rounded-xl bg-[#E6F4EA] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/60 text-xs text-[#0B6B3A] dark:text-emerald-200 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#0B6B3A] shrink-0" />
                                <span className="leading-relaxed">
                                  {language === 'bn' ? 'নির্বাচিত চাঁদা পরিকল্পনা:' : 'Selected Plan:'}{' '}
                                  <strong className="font-bold text-[#14231B] dark:text-white">
                                    {subscriptionFrequency === 'monthly' ? 'মাসিক' : subscriptionFrequency === 'bi_monthly' ? 'দ্বিমাসিক' : subscriptionFrequency === 'quarterly' ? 'ত্রৈমাসিক' : subscriptionFrequency === 'half_yearly' ? 'ষান্মাসিক' : 'বাৎসরিক'}{' '}
                                    ৳{watch('subscription_amount') || '500'} টাকা
                                  </strong>
                                  {language === 'bn' ? '। সংগঠনের সেবামূলক তহবিলে এই অবদান সরাসরি ভূমিকা রাখবে।' : ' — directly fuels community charity.'}
                                </span>
                              </div>

                            </div>
                          )}
                        </div>

                        {/* Step 2 Bottom Actions: Back & Fast Submit */}
                        <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setCurrentStep(1);
                              window.scrollTo({ top: 180, behavior: 'smooth' });
                            }}
                            className="w-full sm:w-1/3 h-12 rounded-2xl border-slate-300 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>{language === 'bn' ? 'পূর্ববর্তী ধাপে ফিরুন' : 'Back to Step 1'}</span>
                          </Button>

                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-2/3 h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#006a4e] hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-700/25 hover:shadow-emerald-700/40 transition-all flex items-center justify-center gap-2 hover:scale-[1.005] active:scale-[0.995]"
                          >
                            {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>{language === 'bn' ? 'আবেদনপত্র জমা হচ্ছে...' : 'Submitting in Seconds...'}</span>
                              </div>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>{language === 'bn' ? 'সদস্য হওয়ার জন্য আবেদনপত্র জমা দিন' : 'Submit Application'}</span>
                              </>
                            )}
                          </Button>
                        </div>

                      </div>
                    )}

                    <p className="text-center text-xs text-slate-400 pt-2">
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