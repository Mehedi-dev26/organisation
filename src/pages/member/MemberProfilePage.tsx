import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMember } from '@/components/member/MemberContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Printer, 
  Camera, 
  Edit3, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Droplet, 
  Calendar,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { compressImage } from '@/lib/imageUtils';

const MemberProfilePage = () => {
  const { language } = useLanguage();
  const { memberData, refetchMember } = useMember();
  const { toast } = useToast();

  const idCardRef = useRef<HTMLDivElement>(null);
  const handlePrintIdCard = useReactToPrint({
    contentRef: idCardRef,
    documentTitle: `Member-ID-Card-${memberData?.member_id || 'ID'}`,
  });

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: memberData?.full_name || '',
    phone: memberData?.phone || '',
    bloodGroup: memberData?.blood_group || 'A+',
    occupation: memberData?.occupation || '',
    address: memberData?.address || '',
  });

  // Photo update state
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberData) return;

    setIsSaving(true);
    try {
      let updatedPhotoUrl = memberData.photo_url;

      // Upload new photo if selected
      if (newPhoto) {
        const compressed = await compressImage(newPhoto, 800, 800, 0.88);
        const fileName = `members/${memberData.member_id || memberData.id}_${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('member-photos')
          .upload(fileName, compressed, { upsert: true, contentType: 'image/jpeg' });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('member-photos').getPublicUrl(fileName);
        updatedPhotoUrl = urlData.publicUrl;
      }

      // Update members table
      const { error: updateErr } = await supabase
        .from('members')
        .update({
          full_name: formData.fullName,
          phone: formData.phone || null,
          blood_group: formData.bloodGroup || null,
          occupation: formData.occupation || null,
          address: formData.address || null,
          photo_url: updatedPhotoUrl,
        })
        .eq('id', memberData.id);

      if (updateErr) throw updateErr;

      await refetchMember();
      setIsEditing(false);
      setNewPhoto(null);
      setPhotoPreview(null);

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে' : 'Profile updated successfully',
      });
    } catch (err: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message || 'সংরক্ষণ ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!memberData) return null;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
            <User className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'bn' ? 'ডিজিটাল আইডি ও প্রোফাইল' : 'Digital ID & Profile'}</span>
          </div>
          <div className="mt-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-[#14231B] font-heading tracking-tight leading-tight">
              {language === 'bn' ? 'সদস্য প্রোফাইল ও আইডি কার্ড' : 'Member Profile & ID Card'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {language === 'bn' 
                ? 'আপনার অফিসিয়াল ডিজিটাল মেম্বারশিপ কার্ড দেখুন, প্রিন্ট করুন এবং তথ্য আপডেট করুন' 
                : 'View official digital membership card, print and manage profile details'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handlePrintIdCard()}
            className="rounded-xl px-4 py-2 font-bold text-xs bg-[#0B6B3A] hover:bg-[#09572E] text-white shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'bn' ? 'আইডি কার্ড প্রিন্ট' : 'Print ID Card'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-xl px-4 py-2 font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? (language === 'bn' ? 'বাতিল' : 'Cancel') : (language === 'bn' ? 'তথ্য এডিট' : 'Edit Profile')}</span>
          </Button>
        </div>
      </div>

      {/* 2. Photo ID Card Generator Callout */}
      <div className="bg-gradient-to-r from-[#0B6B3A] via-[#09572F] to-[#04331B] rounded-[24px] p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-emerald-600/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[#FFE21D] text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'নতুন প্রিমিয়াম ফিচার' : 'New Premium Feature'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
              {language === 'bn' ? 'ফটো আইডি কার্ড ডিজাইনার ও জেনারেটর' : 'Photo ID Card Designer & Generator'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              {language === 'bn'
                ? 'আপনার অফিসিয়াল প্রাতিষ্ঠানিক ছবিসহ পূর্ণাঙ্গ মেম্বার আইডি কার্ড ড্র্যাগ অ্যান্ড ড্রপ করে পজিশন করুন, লাইভ প্রিভিউ দেখুন এবং এইচডি PNG, JPG বা PDF ডাউনলোড করুন।'
                : 'Customize your official photo ID card with interactive drag-and-drop photo positioning, live preview, and HD export.'}
            </p>
          </div>

          <Link
            to="/member/id-card"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#9BD038] hover:bg-[#8bc12e] text-[#14231B] font-black text-sm shadow-md transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{language === 'bn' ? 'আইডি কার্ড তৈরি ও ডাউনলোড করুন' : 'Open ID Card Designer'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* 3. Digital Membership ID Card (Printable & Beautiful) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
            {language === 'bn' ? 'অফিসিয়াল ডিজিটাল আইডি কার্ড' : 'Official Digital Membership Card'}
          </h3>
          <span className="text-xs font-bold text-[#0B6B3A] bg-[#E6F4EA] px-2.5 py-1 rounded-full">
            {language === 'bn' ? 'অনুমোদিত সদস্য' : 'Verified Member'}
          </span>
        </div>

        {/* Printable Card Container */}
        <div ref={idCardRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          {/* Card Front */}
          <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-[#0B6B3A] via-[#08522c] to-[#04331B] text-white p-6 shadow-xl border border-emerald-600/40 min-h-[260px] flex flex-col justify-between">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-white/10 to-transparent pointer-events-none rounded-bl-full" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/15 pb-3 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white p-1.5 shrink-0 shadow-sm flex items-center justify-center">
                  <img src="/logo-round.png" alt="Logo" className="w-full h-full object-contain aspect-square" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-sm tracking-tight text-white leading-tight">
                    {language === 'bn' ? 'সময়ের বাতিঘর ফাউন্ডেশন' : 'Somoyer Batighor Foundation'}
                  </h4>
                  <p className="text-[10px] text-emerald-200 font-medium">
                    একতাই শক্তি, সেবাই ধর্ম
                  </p>
                </div>
              </div>
              <Badge className="bg-[#9BD038] text-[#14231B] font-black text-[10px] border-0">
                {language === 'bn' ? 'সদস্য কার্ড' : 'ID CARD'}
              </Badge>
            </div>

            {/* Card Body */}
            <div className="flex items-center gap-4 py-4 z-10">
              {/* Member Photo: Perfect Square, Never flattened */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 aspect-square ring-4 ring-white/30 bg-slate-100 shadow-md flex items-center justify-center">
                {memberData.photo_url ? (
                  <img
                    src={memberData.photo_url}
                    alt={memberData.full_name}
                    className="w-full h-full object-cover aspect-square"
                  />
                ) : (
                  <span className="text-[#0B6B3A] font-black text-2xl">
                    {memberData.full_name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Member Details */}
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-heading font-black text-lg sm:text-xl text-white truncate leading-snug">
                  {memberData.full_name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md">
                    ID: {memberData.member_id}
                  </span>
                  {memberData.blood_group && (
                    <span className="text-xs font-black bg-rose-500/80 px-2 py-0.5 rounded-md text-white">
                      🩸 {memberData.blood_group}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-100 truncate">
                  {memberData.occupation ? `${memberData.occupation}` : (language === 'bn' ? 'সাধারণ সদস্য' : 'General Member')}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="border-t border-white/15 pt-2 flex items-center justify-between text-[11px] text-emerald-200 z-10">
              <span>{language === 'bn' ? 'যোগদান:' : 'Joined:'} {memberData.joining_date || '২০২৬'}</span>
              <span className="font-bold text-white tracking-widest uppercase">Verified</span>
            </div>
          </div>

          {/* Card Back */}
          <div className="relative rounded-[24px] overflow-hidden bg-slate-900 text-white p-6 shadow-xl border border-slate-800 min-h-[260px] flex flex-col justify-between">
            {/* Header */}
            <div className="border-b border-slate-800 pb-2">
              <p className="text-xs font-bold text-emerald-400">
                {language === 'bn' ? 'সময়ের বাতিঘর ফাউন্ডেশন' : 'Somoyer Batighor Foundation'}
              </p>
              <p className="text-[10px] text-slate-400">
                {language === 'bn' ? 'একটি সম্পূর্ণ অরাজনৈতিক সমাজসেবামূলক প্রতিষ্ঠান' : 'Non-profit social welfare organization'}
              </p>
            </div>

            {/* Rules / Terms */}
            <div className="text-[11px] text-slate-300 space-y-1.5 py-3">
              <p className="leading-relaxed">
                • {language === 'bn' ? 'এই কার্ডটি সদস্যের ব্যক্তিগত ও অহস্তান্তরযোগ্য।' : 'This card is strictly non-transferable.'}
              </p>
              <p className="leading-relaxed">
                • {language === 'bn' ? 'জরুরি রক্তের প্রয়োজনে বা সামাজিক সেবায় কার্ডটি প্রদর্শন করুন।' : 'Present during blood donation or welfare events.'}
              </p>
              <p className="leading-relaxed text-slate-400">
                • {language === 'bn' ? 'কার্ডটি হারিয়ে গেলে অবিলম্বে অফিসে যোগাযোগ করুন।' : 'If lost, please report immediately to office.'}
              </p>
            </div>

            {/* Contact details & Seal */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-400">
              <div>
                <p className="font-bold text-slate-200">যোগাযোগ: contact@somoyerbatighor.org</p>
                <p>সাপাহার, নওগাঁ, রাজশাহী</p>
              </div>
              <div className="text-right">
                <div className="w-16 border-b border-emerald-500 mb-1" />
                <p className="text-[9px] text-emerald-400 font-bold">{language === 'bn' ? 'অনুমোদিত স্বাক্ষর' : 'Authorized'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Member Info Display or Edit Form */}
      {isEditing ? (
        <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
              {language === 'bn' ? 'প্রোফাইল তথ্য সম্পাদনা' : 'Edit Profile Information'}
            </h3>
          </div>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
              {/* Photo Upload with preview */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'প্রোফাইল ছবি পরিবর্তন' : 'Change Profile Photo'}
                </Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 aspect-square ring-2 ring-emerald-500/30 bg-slate-100 flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover aspect-square" />
                    ) : memberData.photo_url ? (
                      <img src={memberData.photo_url} alt="Current" className="w-full h-full object-cover aspect-square" />
                    ) : (
                      <span className="text-[#0B6B3A] font-black text-xl">{memberData.full_name.charAt(0)}</span>
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>{language === 'bn' ? 'নতুন ছবি নির্বাচন' : 'Choose New Photo'}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'পুরো নাম' : 'Full Name'} *
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'ফোন নম্বর' : 'Phone'}
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="blood" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}
                  </Label>
                  <select
                    id="blood"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="occupation" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'পেশা' : 'Occupation'}
                  </Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: শিক্ষক, ব্যবসায়ী' : 'e.g., Teacher'}
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'বর্তমান ঠিকানা' : 'Address'}
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={language === 'bn' ? 'গ্রাম/মহল্লা, থানা, জেলা' : 'Village, Thana, District'}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#0B6B3A] hover:bg-[#09572E] text-white font-bold text-xs px-6 py-2.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      {language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                    </>
                  ) : (
                    language === 'bn' ? 'তথ্য সংরক্ষণ করুন' : 'Save Changes'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
              {language === 'bn' ? 'বিস্তারিত ব্যক্তিগত তথ্য' : 'Personal Information'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-[#0B6B3A] hover:bg-[#E6F4EA] rounded-xl text-xs font-bold gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'এডিট করুন' : 'Edit'}</span>
            </Button>
          </div>
          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase">{language === 'bn' ? 'সদস্য আইডি' : 'Member ID'}</p>
                <p className="text-base font-black text-slate-800 font-mono mt-1">{memberData.member_id}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase">{language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email'}</p>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">{memberData.email || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase">{language === 'bn' ? 'ফোন নম্বর' : 'Phone'}</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{memberData.phone || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase">{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</p>
                <p className="text-base font-black text-rose-600 mt-1">{memberData.blood_group || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase">{language === 'bn' ? 'পেশা' : 'Occupation'}</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{memberData.occupation || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase">{language === 'bn' ? 'বর্তমান ঠিকানা' : 'Address'}</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{memberData.address || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberProfilePage;

