import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
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
  CreditCard,
  Droplet,
  MapPin,
  Briefcase,
  Home,
  Navigation,
  ArrowRight,
  ArrowLeft,
  CircleDollarSign,
  Heart
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
  const [memberType, setMemberType] = useState<'new' | 'existing'>('new');
  const [previousMemberId, setPreviousMemberId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);

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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setOriginalSize(file.size);
      setIsCompressing(true);
      
      try {
        const compressed = await compressImage(file, 400, 400, 0.82);
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
      window.scrollTo({ top: 220, behavior: 'smooth' });
    } else {
      toast.error(
        language === 'bn'
          ? 'অনুগ্রহ করে ১ম ধাপের লাল তারকা চিহ্নিত আবশ্যক ঘরগুলো পূরণ করুন।'
          : 'Please complete all required fields in Step 1.'
      );
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    // Validate occupation on final submit
    if (!data.occupation || data.occupation.trim().length < 2) {
      toast.error(language === 'bn' ? 'অনুগ্রহ করে আপনার পেশা নির্বাচন করুন।' : 'Please select your occupation.');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl: string | null = null;

      if (compressedBlob) {
        const fileExt = photoFile?.name.split('.').pop() || 'jpg';
        const fileName = `pending/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        try {
          const { error: uploadError } = await supabase.storage
            .from('member-photos')
            .upload(fileName, compressedBlob, {
              contentType: compressedBlob.type || 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.warn('Storage upload warning:', uploadError);
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('member-photos')
              .getPublicUrl(fileName);
            
            photoUrl = publicUrlData.publicUrl;
          }
        } catch (uploadEx) {
          console.warn('Storage upload exception caught:', uploadEx);
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

      const memberIdToUse = memberType === 'existing' && previousMemberId.trim()
        ? previousMemberId.trim()
        : generateMemberId();

      const isDonateYes = data.willing_to_donate_blood === 'yes';
      const isSubYes = data.willing_to_pay_subscription === 'yes';
      const subAmountNum = isSubYes ? parseFloat(data.subscription_amount || '0') || 0 : 0;

      const { error } = await supabase.from('members').insert({
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

      if (error) throw error;

      // Auto-register in blood_donors if willing to donate blood
      if (isDonateYes && data.blood_group) {
        try {
          await supabase.from('blood_donors').insert({
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
            notes: `সদস্য আবেদন ফরম থেকে যুক্ত (চাঁদা: ${isSubYes ? data.subscription_frequency : 'না'}, পরিমাণ: ${subAmountNum}৳)`
          });
        } catch (bErr) {
          console.warn('Could not auto-add to blood_donors:', bErr);
        }
      }

      setCreatedMemberId(memberIdToUse);
      setIsSuccess(true);
      toast.success(
        language === 'bn'
          ? 'আপনার সদস্য আবেদন সফলভাবে জমা হয়েছে!'
          : 'Your application has been submitted successfully!'
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

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16 px-4 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900">
          <Card className="max-w-md w-full text-center border-2 border-emerald-500/30 shadow-2xl bg-white/90 dark:bg-card/90 backdrop-blur-xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <CardContent className="pt-10 pb-10 px-6 sm:px-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 via-teal-600 to-[#006a4e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-700/25 text-white">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2 font-heading text-slate-800 dark:text-slate-100">
                {language === 'bn' ? 'আবেদন সফলভাবে সম্পন্ন হয়েছে!' : 'Application Submitted!'}
              </h2>
              {createdMemberId && (
                <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-sm mb-4">
                  {language === 'bn' ? 'আবেদন ট্র্যাকিং আইডি:' : 'Tracking ID:'} {createdMemberId}
                </div>
              )}
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                {language === 'bn'
                  ? 'আপনার সদস্য আবেদনটি পর্যালোচনার জন্য জমা নেওয়া হয়েছে। কেন্দ্রীয় কার্যনির্বাহী পরিষদ কর্তৃক যাচাই শেষে আপনার সদস্যপদ চূড়ান্ত করা হবে।'
                  : 'Your membership application is being reviewed. You will be notified once approved by the executive council.'}
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

  // Dynamic Frequency Label Helper
  const getFrequencyLabel = () => {
    switch (subscriptionFrequency) {
      case 'bi_monthly':
        return language === 'bn' ? '২ মাসের চাঁদার মোট পরিমাণ (টাকা)' : '2-Month Total Dues (BDT)';
      case 'quarterly':
        return language === 'bn' ? '৩ মাসের (ত্রৈমাসিক) চাঁদার মোট পরিমাণ (টাকা)' : 'Quarterly (3-Month) Dues (BDT)';
      case 'half_yearly':
        return language === 'bn' ? '৬ মাসের (ষান্মাসিক) চাঁদার মোট পরিমাণ (টাকা)' : 'Half-Yearly (6-Month) Dues (BDT)';
      case 'yearly':
        return language === 'bn' ? 'বাৎসরিক (১২ মাসের) চাঁদার মোট পরিমাণ (টাকা)' : 'Yearly (12-Month) Dues (BDT)';
      case 'monthly':
      default:
        return language === 'bn' ? 'মাসিক চাঁদার পরিমাণ (টাকা)' : 'Monthly Dues Amount (BDT)';
    }
  };

  const getFrequencyHelperText = () => {
    switch (subscriptionFrequency) {
      case 'bi_monthly':
        return language === 'bn' ? 'প্রতি ২ মাসে এককালীন পরিশোধযোগ্য চাঁদার পরিমাণ।' : 'Contribution payable every 2 months.';
      case 'quarterly':
        return language === 'bn' ? 'প্রতি ৩ মাসে (ত্রৈমাসিক) এককালীন পরিশোধযোগ্য চাঁদার পরিমাণ।' : 'Contribution payable every 3 months.';
      case 'half_yearly':
        return language === 'bn' ? 'প্রতি ৬ মাসে (ষান্মাসিক) এককালীন পরিশোধযোগ্য চাঁদার পরিমাণ।' : 'Contribution payable every 6 months.';
      case 'yearly':
        return language === 'bn' ? 'বছরে ১ বার এককালীন পরিশোধযোগ্য চাঁদার পরিমাণ।' : 'Contribution payable once a year.';
      case 'monthly':
      default:
        return language === 'bn' ? 'প্রতি মাসে নিয়মিত প্রদেয় চাঁদার পরিমাণ।' : 'Regular monthly contribution amount.';
    }
  };

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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 selection:bg-emerald-500 selection:text-white">
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
              ? 'নিচের সহজ ফর্মটি পূরণ করে আমাদের বৃহৎ সমাজসেবামূলক পরিবারে যুক্ত হোন।'
              : 'Complete the form below to become an active accredited member of Somoyer Batighor.'}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-10 sm:py-14 px-4 bg-gradient-to-b from-slate-100/60 to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Benefits & Trust badges */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {language === 'bn' ? 'সদস্য সুবিধার বিবরণ' : 'Membership Benefits'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
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

              {/* Verification Note */}
              <div className="px-5 py-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
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
              <Card className="shadow-2xl border-2 border-emerald-500/30 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl">
                <CardHeader className="text-center pb-5 pt-7 px-6 bg-gradient-to-r from-emerald-100/40 via-teal-50/30 to-emerald-100/40 dark:from-emerald-950/40 dark:to-slate-900 border-b border-emerald-100/70 dark:border-slate-800">
                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 via-teal-600 to-[#006a4e] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-700/25 text-white">
                    <Users className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? 'সদস্য আবেদন ফর্ম' : 'Membership Application Form'}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'পর্যায়ক্রমে ২টি ধাপে সঠিক তথ্য দিয়ে আবেদনপত্রটি সম্পন্ন করুন'
                      : 'Please complete the application across 2 steps'}
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
                            {language === 'bn' ? '(ঐচ্ছিক - ছবি স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হবে)' : '(Optional - auto compressed)'}
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

                        {/* SECTION: Address (বর্তমান ও স্থায়ী ঠিকানা) - Same unified styling without separate box */}
                        <div className="space-y-4 pt-1">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {language === 'bn' ? 'ঠিকানা সংক্রান্ত তথ্য' : 'Address Details'}
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

                          {/* Permanent Address - Standard Field Styling Matching Name/Phone */}
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{language === 'bn' ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</span>
                                <span className="text-red-500">*</span>
                              </Label>
                              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                                {language === 'bn' ? 'সমগ্র বাংলাদেশ' : 'All Bangladesh'}
                              </span>
                            </div>

                            {/* 4-Dropdowns Grid: Division, District, Upazila, Union */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              
                              {/* 1. Division (বিভাগ) */}
                              <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {language === 'bn' ? 'স্থায়ী বিভাগ' : 'Division'} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                                  <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600">
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

                              {/* 2. District (জেলা) */}
                              <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {language === 'bn' ? 'স্থায়ী জেলা' : 'District'} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                                  <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600">
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

                              {/* 3. Upazila (উপজেলা) */}
                              <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {language === 'bn' ? 'উপজেলা / থানা' : 'Upazila'} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedUpazila} onValueChange={handleUpazilaChange}>
                                  <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600">
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

                              {/* 4. Union (ইউনিয়ন / ওয়ার্ড) */}
                              <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {language === 'bn' ? 'ইউনিয়ন / পৌরসভা' : 'Union / Ward'} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedUnion} onValueChange={handleUnionChange}>
                                  <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600">
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
                                className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600"
                                {...register('permanent_village')}
                              />
                            </div>

                            {/* Live Address Preview Pill */}
                            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="leading-relaxed">
                                {language === 'bn' ? 'নির্বাচিত স্থায়ী ঠিকানা:' : 'Selected Permanent Address:'}{' '}
                                <strong className="font-bold">
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
                    {/* ==================================================== */}
                    {currentStep === 2 && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        
                        {/* 1. SECTION: Profession & Blood Group */}
                        <div className="space-y-4">
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
                                {language === 'bn' ? 'পেশা নির্বাচন করুন' : 'Occupation'} <span className="text-red-500">*</span>
                              </Label>
                              <Select 
                                value={selectedOccupation} 
                                onValueChange={handleOccupationSelect}
                              >
                                <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600">
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
                                <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                                  <Input
                                    placeholder={language === 'bn' ? 'আপনার সুনির্দিষ্ট পেশাটি লিখুন' : 'Specify your occupation'}
                                    className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700"
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
                                <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600">
                                  <SelectValue
                                    placeholder={language === 'bn' ? 'রক্তের গ্রুপ নির্বাচন করুন' : 'Select blood group'}
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

                        {/* 2. SECTION: Blood Donation Program Willingness */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                            <Droplet className="w-4 h-4 text-rose-600" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {language === 'bn' ? 'রক্তদান কর্মসূচিতে সম্পৃক্ততা' : 'Blood Donation Program'}
                            </h4>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                              {language === 'bn' ? 'আপনি কি সংগঠনের জরুরি রক্তদান কর্মসূচিতে যুক্ত হতে ইচ্ছুক?' : 'Willing to join emergency blood donation program?'}
                            </Label>
                            <Select 
                              value={willingToDonate} 
                              onValueChange={(val) => {
                                setWillingToDonate(val);
                                setValue('willing_to_donate_blood', val);
                              }}
                            >
                              <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600">
                                <SelectValue placeholder="নির্বাচন করুন" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes" className="text-sm">
                                  {language === 'bn' ? 'হ্যাঁ, আমি রক্তদান কর্মসূচিতে যুক্ত হতে ইচ্ছুক' : 'Yes, I want to join blood donor pool'}
                                </SelectItem>
                                <SelectItem value="no" className="text-sm">
                                  {language === 'bn' ? 'না, এই মুহূর্তে ইচ্ছুক নই' : 'No, not at this moment'}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {willingToDonate === 'yes' && (
                            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40 flex items-start gap-3 animate-in fade-in duration-200">
                              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                <Heart className="w-4 h-4 fill-white" />
                              </div>
                              <div className="text-xs leading-relaxed text-rose-900 dark:text-rose-200">
                                <p className="font-bold">
                                  {language === 'bn' ? 'ধন্যবাদ ও সাধুবাদ!' : 'Thank you!'}
                                </p>
                                <p className="mt-0.5 text-rose-800/90 dark:text-rose-300">
                                  {language === 'bn'
                                    ? 'সময়ের বাতিঘরের জরুরি রক্তদাতা পরিবারে আপনাকে স্বাগতম। আপনার এলাকায় কোনো মুমূর্ষু রোগীর জরুরি রক্তের প্রয়োজনে আপনার সাথে যোগাযোগ করা হতে পারে।'
                                    : 'You will be linked with our emergency voluntary blood donation network for patients in need.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. SECTION: Subscription / Membership Dues Management */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {language === 'bn' ? 'চাঁদা ব্যবস্থাপনা ও অনুদান অঙ্গীকার' : 'Membership Dues Pledge'}
                            </h4>
                          </div>

                          {/* Willing to pay dues dropdown */}
                          <div className="space-y-1.5">
                            <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                              {language === 'bn' ? 'আপনি কি সংগঠনের নিয়মিত চাঁদা প্রদান করতে ইচ্ছুক?' : 'Are you willing to contribute regular dues?'}
                            </Label>
                            <Select 
                              value={willingToPayDues} 
                              onValueChange={(val) => {
                                setWillingToPayDues(val);
                                setValue('willing_to_pay_subscription', val);
                              }}
                            >
                              <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600">
                                <SelectValue placeholder="নির্বাচন করুন" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes" className="text-sm">
                                  {language === 'bn' ? 'হ্যাঁ, সংগঠনের নিয়মিত চাঁদা প্রদান করতে ইচ্ছুক' : 'Yes, I am willing to contribute dues'}
                                </SelectItem>
                                <SelectItem value="no" className="text-sm">
                                  {language === 'bn' ? 'না, আপাতত ইচ্ছুক নই' : 'No, not at this time'}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Frequency & Dynamic Amount (Active if 'yes') */}
                          {willingToPayDues === 'yes' && (
                            <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 animate-in fade-in duration-200">
                              
                              {/* Frequency Dropdown */}
                              <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {language === 'bn' ? 'চাঁদা প্রদানের সময়কাল নির্বাচন করুন' : 'Select Contribution Frequency'}
                                </Label>
                                <Select 
                                  value={subscriptionFrequency} 
                                  onValueChange={handleFrequencyChange}
                                >
                                  <SelectTrigger className="h-10 text-sm rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600">
                                    <SelectValue placeholder="সময়কাল" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="monthly" className="text-sm">
                                      {language === 'bn' ? 'মাসিক (প্রতি মাসে একবার)' : 'Monthly (Once every month)'}
                                    </SelectItem>
                                    <SelectItem value="bi_monthly" className="text-sm">
                                      {language === 'bn' ? 'দ্বিমাসিক (প্রতি ২ মাসে একবার)' : 'Bi-Monthly (Once every 2 months)'}
                                    </SelectItem>
                                    <SelectItem value="quarterly" className="text-sm">
                                      {language === 'bn' ? 'ত্রৈমাসিক (প্রতি ৩ মাসে একবার)' : 'Quarterly (Once every 3 months)'}
                                    </SelectItem>
                                    <SelectItem value="half_yearly" className="text-sm">
                                      {language === 'bn' ? 'ষান্মাসিক (প্রতি ৬ মাসে একবার)' : 'Half-Yearly (Once every 6 months)'}
                                    </SelectItem>
                                    <SelectItem value="yearly" className="text-sm">
                                      {language === 'bn' ? 'বাৎসরিক (বছরে ১ বার)' : 'Yearly (Once a year)'}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Dynamic Amount Field tailored to selected frequency */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="subscription_amount" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {getFrequencyLabel()} <span className="text-red-500">*</span>
                                  </Label>
                                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                    {getFrequencyHelperText()}
                                  </span>
                                </div>

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
                                    className="pl-8 h-10 text-sm font-semibold rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-600 focus:ring-emerald-600"
                                    {...register('subscription_amount')}
                                  />
                                </div>

                                {/* Quick selection chips */}
                                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                  <span className="text-[11px] text-slate-400">
                                    {language === 'bn' ? 'সহজ নির্বাচন:' : 'Quick Select:'}
                                  </span>
                                  {quickAmounts.map((amt) => (
                                    <button
                                      key={amt}
                                      type="button"
                                      onClick={() => setValue('subscription_amount', amt)}
                                      className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors shadow-2xs"
                                    >
                                      ৳{amt}
                                    </button>
                                  ))}
                                </div>
                              </div>

                            </div>
                          )}
                        </div>

                        {/* Step 2 Bottom Actions: Back & Submit */}
                        <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-3">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setCurrentStep(1);
                              window.scrollTo({ top: 220, behavior: 'smooth' });
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
                              <span>{language === 'bn' ? 'আবেদনপত্র জমা হচ্ছে...' : 'Submitting...'}</span>
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
