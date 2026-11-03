import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMember } from '@/components/member/MemberContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Wallet, 
  TrendingUp, 
  Droplet, 
  Heart, 
  Camera, 
  X, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Bell, 
  CreditCard, 
  User, 
  Key, 
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { compressImage } from '@/lib/imageUtils';
import { getDonationEligibility, formatBengaliDate } from '@/lib/bloodUtils';

const MemberDashboardHome = () => {
  const { language } = useLanguage();
  const { 
    memberData, 
    paidDues, 
    unpaidDues, 
    yearlyTotal, 
    bloodDonorInfo, 
    refetchBloodDonor, 
    newsData, 
    newsLoading,
    unpaidMonths
  } = useMember();
  const { toast } = useToast();

  // Blood donation update modal state
  const [isBloodDialogOpen, setIsBloodDialogOpen] = useState(false);
  const [lastDonatedDate, setLastDonatedDate] = useState('');
  const [donationPhoto, setDonationPhoto] = useState<File | null>(null);
  const [donationPhotoPreview, setDonationPhotoPreview] = useState<string | null>(null);
  const [donationNotes, setDonationNotes] = useState('');
  const [isSavingBloodInfo, setIsSavingBloodInfo] = useState(false);

  const handleOpenBloodDialog = () => {
    setLastDonatedDate(bloodDonorInfo?.last_donated || '');
    setDonationNotes(bloodDonorInfo?.notes || '');
    setDonationPhoto(null);
    setDonationPhotoPreview(null);
    setIsBloodDialogOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDonationPhoto(file);
      setDonationPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveBloodDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberData) return;

    setIsSavingBloodInfo(true);
    try {
      let photoUrlToSave = '';
      if (donationPhoto) {
        const compressed = await compressImage(donationPhoto, 800, 800, 0.88);
        const fileName = `donations/${memberData.member_id || memberData.id}_${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('member-photos')
          .upload(fileName, compressed, { upsert: true, contentType: 'image/jpeg' });
        
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('member-photos').getPublicUrl(fileName);
          photoUrlToSave = urlData.publicUrl;
        }
      }

      const noteText = donationNotes.trim() + (photoUrlToSave ? ` [ছবি: ${photoUrlToSave}]` : '');

      if (bloodDonorInfo?.id) {
        const { error } = await supabase
          .from('blood_donors')
          .update({
            last_donated: lastDonatedDate || null,
            notes: noteText || bloodDonorInfo.notes,
            blood_group: memberData.blood_group || bloodDonorInfo.blood_group || 'A+',
            status: 'approved',
            is_member: true,
          })
          .eq('id', bloodDonorInfo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blood_donors')
          .insert({
            member_id: memberData.member_id,
            full_name: memberData.full_name,
            phone: memberData.phone || '',
            blood_group: memberData.blood_group || 'A+',
            address: memberData.address || '',
            last_donated: lastDonatedDate || null,
            notes: noteText || 'সদস্য প্যানেল থেকে রক্তদানের তথ্য আপডেট',
            status: 'approved',
            is_public_details: true,
            is_member: true,
          });

        if (error) throw error;
      }

      await refetchBloodDonor();
      setIsBloodDialogOpen(false);
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'রক্তদানের তথ্য সফলভাবে সংরক্ষিত হয়েছে।' : 'Blood donation info updated.',
      });
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'সংরক্ষণ করা যায়নি',
        variant: 'destructive',
      });
    } finally {
      setIsSavingBloodInfo(false);
    }
  };

  const donorEligibility = getDonationEligibility(bloodDonorInfo?.last_donated || null);
  const donorBloodGroup = memberData?.blood_group || bloodDonorInfo?.blood_group || 'অনির্ধারিত';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Banner */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{language === 'bn' ? 'সদস্য ড্যাশবোর্ড' : 'Member Dashboard'}</span>
        </div>
        <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#14231B] font-heading tracking-tight leading-tight">
              {language === 'bn' ? `স্বাগতম, ${memberData?.full_name}!` : `Welcome, ${memberData?.full_name}!`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {language === 'bn' 
                ? 'সময়ের বাতিঘর ফাউন্ডেশন - আপনার সদস্য কার্যক্রম ও আর্থিক সারসংক্ষেপ' 
                : 'Somoyer Batighor Foundation - Member activities and overview'}
            </p>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {format(new Date(), 'dd MMMM yyyy', { locale: language === 'bn' ? bn : undefined })}
          </div>
        </div>
      </div>

      {/* 2. Top 4 Activity Stat Cards (Mobile 2-column, Desktop 4-column) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: পরিশোধিত চাঁদা */}
        <Link
          to="/member/dues"
          className="group bg-white rounded-[20px] sm:rounded-[22px] p-3.5 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-2 sm:gap-3 relative overflow-hidden"
        >
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#059669]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 z-10">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#E6F4EA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2] text-[#059669]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'পরিশোধিত চাঁদা' : 'Paid Dues'}
              </p>
              <p className="text-base sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight mt-0.5 truncate">
                ৳{paidDues.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-[#E6F4EA] text-[#059669] items-center justify-center shrink-0 z-10 shadow-2xs">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </Link>

        {/* Card 2: বকেয়া চাঁদা */}
        <Link
          to="/member/dues"
          className="group bg-white rounded-[20px] sm:rounded-[22px] p-3.5 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-2 sm:gap-3 relative overflow-hidden"
        >
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className={`w-full h-full ${unpaidDues > 0 ? 'fill-[#EF4444]' : 'fill-[#10B981]'}`}>
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 z-10">
            <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs ${
              unpaidDues > 0 ? 'bg-[#FEE2E2]' : 'bg-[#E6F4EA]'
            }`}>
              <Wallet className={`w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2] ${unpaidDues > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'বকেয়া চাঁদা' : 'Unpaid Dues'}
              </p>
              <p className={`text-base sm:text-2xl lg:text-3xl font-black leading-tight mt-0.5 truncate ${
                unpaidDues > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                ৳{unpaidDues.toLocaleString()}
              </p>
            </div>
          </div>
          <div className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center shrink-0 z-10 shadow-2xs ${
            unpaidDues > 0 ? 'bg-[#FEE2E2] text-rose-600' : 'bg-[#E6F4EA] text-emerald-600'
          }`}>
            <span className="text-[10px] font-black">{unpaidMonths.length}</span>
          </div>
        </Link>

        {/* Card 3: বার্ষিক মোট প্রদেয় */}
        <Link
          to="/member/dues"
          className="group bg-white rounded-[20px] sm:rounded-[22px] p-3.5 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-2 sm:gap-3 relative overflow-hidden"
        >
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#3B82F6]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 z-10">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EEF4FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2] text-[#2563EB]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'বার্ষিক হিসাব (১ বছর)' : 'Yearly Total'}
              </p>
              <p className="text-base sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight mt-0.5 truncate">
                ৳{yearlyTotal.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-[#EEF4FF] text-[#2563EB] items-center justify-center shrink-0 z-10 shadow-2xs">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </Link>

        {/* Card 4: রক্তদানের প্রস্তুতি */}
        <div
          onClick={handleOpenBloodDialog}
          className="group bg-white rounded-[20px] sm:rounded-[22px] p-3.5 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-2 sm:gap-3 relative overflow-hidden cursor-pointer"
        >
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#E11D48]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 z-10">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Droplet className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2] text-rose-600 fill-rose-500/20" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? `রক্তের গ্রুপ: ${donorBloodGroup}` : `Blood: ${donorBloodGroup}`}
              </p>
              <p className="text-sm sm:text-lg font-black text-slate-900 leading-tight mt-0.5 truncate">
                {donorEligibility.isReady ? (language === 'bn' ? 'প্রস্তুত' : 'Ready') : (language === 'bn' ? donorEligibility.labelBn : donorEligibility.labelEn)}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-rose-50 text-rose-600 items-center justify-center shrink-0 z-10 shadow-2xs">
            <Heart className="w-4 h-4 fill-rose-500/30" />
          </div>
        </div>
      </div>

      {/* 2.5 Unpaid Due Action Banner */}
      {unpaidMonths.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-100/30 border-2 border-amber-300 rounded-[22px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(245,158,11,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="font-heading font-black text-slate-900 text-sm sm:text-base">
                {language === 'bn' 
                  ? `আপনার ${unpaidMonths.length} মাসের চাঁদা বকেয়া রয়েছে (মোট: ৳${unpaidDues.toLocaleString()})` 
                  : `You have ${unpaidMonths.length} unpaid due(s) pending (Total: ৳${unpaidDues.toLocaleString()})`}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {language === 'bn'
                  ? 'বিকাশ, নগদ, রকেট বা ব্যাংক অ্যাকাউন্টে চাঁদা পরিশোধ করে ট্রানজেকশন আইডি জমা দিন।'
                  : 'Pay now via bKash, Nagad, Rocket, or Bank and submit your Transaction ID.'}
              </p>
            </div>
          </div>
          <Link
            to="/member/dues"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B6B3A] hover:bg-[#09572E] text-white font-bold text-xs shadow-xs shrink-0 transition-transform active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>{language === 'bn' ? 'চাঁদা পরিশোধ করুন' : 'Pay Dues'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Blood Donation Status Highlight Card */}
      <Card className="rounded-[24px] border border-rose-100 shadow-[0_4px_25px_rgba(225,29,72,0.04)] overflow-hidden bg-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-100/30 via-rose-50/10 to-transparent pointer-events-none rounded-bl-full" />
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Droplet className="w-6 h-6 stroke-[2.4] fill-rose-500/20 text-rose-600" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-heading font-black text-base sm:text-lg text-slate-800">
                    {language === 'bn' ? 'রক্তদানের তথ্য ও প্রস্তুতি' : 'Blood Donation Status'}
                  </h3>
                  <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-extrabold text-xs">
                    {donorBloodGroup}
                  </Badge>
                  <Badge 
                    className={`text-xs font-bold ${
                      donorEligibility.isReady 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {donorEligibility.isReady ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {language === 'bn' ? 'রক্তদানের জন্য প্রস্তুত' : 'Ready to Donate'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {language === 'bn' ? donorEligibility.labelBn : donorEligibility.labelEn}
                      </span>
                    )}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {language === 'bn' ? 'সর্বশেষ রক্তদান: ' : 'Last Donated: '}
                  <span className="font-bold text-slate-800">
                    {bloodDonorInfo?.last_donated ? formatBengaliDate(bloodDonorInfo.last_donated) : (language === 'bn' ? 'এখনও তথ্য যুক্ত করা হয়নি' : 'Not recorded yet')}
                  </span>
                </p>
              </div>
            </div>

            <Button
              onClick={handleOpenBloodDialog}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#0B6B3A] hover:bg-[#08522c] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white/30" />
              <span>{language === 'bn' ? 'সর্বশেষ রক্তদান আপডেট' : 'Update Donation'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Quick Action Navigation Cards (2-column on mobile, 4-column on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <Link
          to="/member/dues"
          className="group p-3.5 sm:p-5 rounded-[20px] sm:rounded-[22px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#0B6B3A]/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#E6F4EA] text-[#0B6B3A] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.3]" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-[#0B6B3A] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-3 sm:mt-4">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
              {language === 'bn' ? 'চাঁদা ব্যবস্থাপনা' : 'Dues & Fees'}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
              {language === 'bn' ? 'মাসিক চাঁদার হিসাব ও রসিদ' : 'View payments & receipts'}
            </p>
          </div>
        </Link>

        <Link
          to="/member/pay-dues"
          className="group p-3.5 sm:p-5 rounded-[20px] sm:rounded-[22px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.3]" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-[#D97706] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-3 sm:mt-4">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
              {language === 'bn' ? 'অনলাইন চাঁদা পরিশোধ' : 'Pay Online'}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
              {language === 'bn' ? 'বিকাশ/নগদ মাধ্যমে পরিশোধ' : 'Instant gateway payment'}
            </p>
          </div>
        </Link>

        <Link
          to="/member/id-card"
          className="group p-3.5 sm:p-5 rounded-[20px] sm:rounded-[22px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#E6F4EA] text-[#0B6B3A] flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.3]" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-[#0B6B3A] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-3 sm:mt-4">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
              {language === 'bn' ? 'ফটো আইডি কার্ড' : 'Photo ID Card'}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
              {language === 'bn' ? 'কাস্টমাইজ, প্রিন্ট ও ডাউনলোড' : 'Customize, print & download'}
            </p>
          </div>
        </Link>

        <Link
          to="/member/security"
          className="group p-3.5 sm:p-5 rounded-[20px] sm:rounded-[22px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Key className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.3]" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-3 sm:mt-4">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
              {language === 'bn' ? 'নিরাপত্তা ও পাসওয়ার্ড' : 'Security & Password'}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
              {language === 'bn' ? 'লগইন পাসওয়ার্ড পরিবর্তন' : 'Change password & secure account'}
            </p>
          </div>
        </Link>
      </div>

      {/* 5. Latest News & Notices Board */}
      <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
              {language === 'bn' ? 'সংবাদ ও জরুরি নোটিশ' : 'News & Announcements'}
            </h3>
          </div>
        </div>
        <CardContent className="p-5">
          {newsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#0B6B3A]" />
            </div>
          ) : !newsData || newsData.length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-sm">
              {language === 'bn' ? 'কোনো নতুন নোটিশ নেই' : 'No announcements available'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {newsData.map((news: any) => (
                <div key={news.id} className="p-4 rounded-2xl border border-slate-100 bg-[#F9FBFA] hover:bg-white hover:shadow-sm transition-all">
                  <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">
                    {language === 'bn' ? news.title_bn : (news.title_en || news.title_bn)}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {language === 'bn' ? news.content_bn : (news.content_en || news.content_bn)}
                  </p>
                  {news.published_at && (
                    <p className="text-[11px] font-medium text-slate-400 mt-2">
                      {format(new Date(news.published_at), 'PPP', { 
                        locale: language === 'bn' ? bn : enUS 
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blood Update Dialog */}
      <Dialog open={isBloodDialogOpen} onOpenChange={setIsBloodDialogOpen}>
        <DialogContent className="max-w-md rounded-[24px] p-6 bg-white shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-800 font-heading">
              <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Droplet className="w-4 h-4" />
              </span>
              {language === 'bn' ? 'রক্তদানের তথ্য আপডেট' : 'Update Blood Donation Info'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveBloodDonation} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="last-donation-date" className="text-xs font-bold text-slate-700">
                {language === 'bn' ? 'সর্বশেষ কত তারিখে রক্ত দিয়েছেন? *' : 'Last Donation Date *'}
              </Label>
              <Input
                id="last-donation-date"
                type="date"
                value={lastDonatedDate}
                onChange={(e) => setLastDonatedDate(e.target.value)}
                className="rounded-xl border-slate-200 h-11 text-sm font-medium"
                required
              />
              <p className="text-[11px] text-slate-500">
                {language === 'bn' ? 'তারিখ দিলে স্বয়ংক্রিয়ভাবে পরবর্তী রক্তদানের হিসাব প্রস্তুত হবে।' : 'Calculates 90-day rest and next eligibility automatically.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                {language === 'bn' ? 'রক্তদানের ছবি বা প্রশংসাপত্র (ঐচ্ছিক)' : 'Donation Photo or Certificate (Optional)'}
              </Label>
              
              {donationPhotoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-50 flex items-center justify-center">
                  <img src={donationPhotoPreview} alt="Donation preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setDonationPhoto(null);
                      setDonationPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20">
                  <Camera className="w-7 h-7 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-600">
                    {language === 'bn' ? 'ছবি আপলোড করতে ক্লিক করুন' : 'Click to upload photo'}
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="donation-notes" className="text-xs font-bold text-slate-700">
                {language === 'bn' ? 'রক্তদানের স্থান / বিবরণ (ঐচ্ছিক)' : 'Location or Details (Optional)'}
              </Label>
              <Input
                id="donation-notes"
                type="text"
                placeholder={language === 'bn' ? 'যেমন: নওগাঁ সদর হাসপাতাল' : 'e.g., Naogaon Hospital'}
                value={donationNotes}
                onChange={(e) => setDonationNotes(e.target.value)}
                className="rounded-xl border-slate-200 h-10 text-sm"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBloodDialogOpen(false)}
                className="rounded-xl text-xs font-bold"
                disabled={isSavingBloodInfo}
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={isSavingBloodInfo}
                className="rounded-xl bg-[#0B6B3A] hover:bg-[#08522c] text-white text-xs font-bold px-5"
              >
                {isSavingBloodInfo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    {language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                  </>
                ) : (
                  language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Details'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberDashboardHome;

