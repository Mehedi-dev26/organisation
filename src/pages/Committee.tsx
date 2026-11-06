import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  PhoneCall, 
  Loader2, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  Copy, 
  Check, 
  Mail, 
  Calendar, 
  MapPin, 
  Briefcase,
  CheckCircle2,
  FileText,
  X,
  Crown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getMemberRoleDetails, CommitteeMember, CommitteeCustomDetailsMap } from '@/lib/committeeUtils';

const Committee = () => {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Enable realtime subscription for instant auto-refresh
  useRealtimeSubscription({ table: 'committee_members', queryKey: ['public-committee'] });

  const { data: committeeMembers = [], isLoading } = useQuery({
    queryKey: ['public-committee'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as CommitteeMember[];
    },
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });

  // Fetch custom roles, responsibilities & about text from site_settings
  const { data: customDetailsMap = {} } = useQuery<CommitteeCustomDetailsMap>({
    queryKey: ['committee-custom-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'committee_custom_details')
        .maybeSingle();
      if (error || !data?.value) return {};
      return data.value as CommitteeCustomDetailsMap;
    },
    staleTime: 1000 * 60,
  });

  // 0. Director (পরিচালক) - Top Single Centered
  const isDirector = (m: CommitteeMember) => {
    const posBn = (m.position_bn || '').trim().toLowerCase();
    const posEn = (m.position_en || '').trim().toLowerCase();
    return posBn.includes('পরিচালক') || posEn.includes('director');
  };

  const director = committeeMembers.find(isDirector);
  const nonDirectorMembers = committeeMembers.filter(m => m.id !== director?.id);

  // Desktop Hierarchy:
  // Row 1 below Director: 3 leaders (সভাপতি, সহ-সভাপতি, সাধারণ সম্পাদক ইত্যাদি)
  const top3Desktop = nonDirectorMembers.slice(0, 3);
  // Row 2 below Director: 2 leaders (৪র্থ ও ৫ম জন) centered
  const next2Desktop = nonDirectorMembers.slice(3, 5);

  // Executive Council / Departmental Secretaries (from 6th non-director onwards)
  const executiveCouncil = nonDirectorMembers.slice(5);

  // Mobile Hierarchy:
  // 1st alone on top: Director if available, otherwise first leader
  const mobileTopLeader = director || nonDirectorMembers[0];
  // Below Top Leader on mobile: Everyone else in 2-column grid with generous middle spacing
  const mobileRemainingMembers = committeeMembers.filter(m => m.id !== mobileTopLeader?.id);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast({
      title: language === 'bn' ? 'নম্বর কপি সম্পন্ন' : 'Phone copied',
      description: phone,
    });
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const selectedMemberRole = selectedMember 
    ? getMemberRoleDetails(
        selectedMember.position_bn, 
        language, 
        customDetailsMap[selectedMember.id]
      )
    : null;

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-[#0B6B3A] via-[#08522c] to-[#04331a] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold shadow-xs mb-4">
            <Award className="w-4 h-4 text-amber-300" />
            <span>{language === 'bn' ? 'কার্যনির্বাহী ও পরিচালনা পরিষদ' : 'Executive & Governing Council'}</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight">
            {language === 'bn' ? 'আমাদের কার্যনির্বাহী কমিটি' : 'Executive Committee'}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/85 max-w-2xl mx-auto font-medium">
            {language === 'bn' 
              ? 'সময়ের বাতিঘর ফাউন্ডেশন - সততা, মানবসেবা ও সামাজিক উন্নয়নে নিবেদিতপ্রাণ নেতৃত্ব' 
              : 'Dedicated leadership committed to social welfare, integrity, and human service.'}
          </p>
        </div>
      </section>

      {/* Main Committee Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Signature Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="flex justify-center mb-4 sm:mb-5">
              <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] shadow-xs">
                <span className="w-5 h-5 rounded-full bg-[#0B6B3A] flex items-center justify-center text-white flex-shrink-0">
                  <Award className="w-3.5 h-3.5" />
                </span>
                <span className="text-[#0B6B3A] text-xs sm:text-sm font-semibold tracking-wide">
                  {language === 'bn' ? 'সংগঠন পরিচালনা ও নেতৃত্ব পরিষদ' : 'Governance & Leadership Council'}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap mb-3">
              <svg 
                className="w-6 h-6 sm:w-8 sm:h-8 text-[#0B6B3A] flex-shrink-0 hidden xs:inline-block" 
                viewBox="0 0 24 24" 
                fill="none" 
                aria-hidden="true"
              >
                <path d="M19 16C14 15 9.5 12 6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M17 21C12.5 20.5 8 18 3 13.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M21 11C16 10 11.5 7 8 2" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              </svg>

              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                <span className="text-[#14231B] dark:text-slate-100">
                  {language === 'bn' ? 'পরিষদ ' : 'Council '}
                </span>
                <span className="text-[#0B6B3A] relative inline-block">
                  {language === 'bn' ? 'সদস্যবৃন্দ' : 'Directory'}
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
              </h2>

              <svg 
                className="w-6 h-6 sm:w-8 sm:h-8 text-[#0B6B3A] flex-shrink-0 -scale-x-100 hidden xs:inline-block" 
                viewBox="0 0 24 24" 
                fill="none" 
                aria-hidden="true"
              >
                <path d="M19 16C14 15 9.5 12 6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M17 21C12.5 20.5 8 18 3 13.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M21 11C16 10 11.5 7 8 2" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            </div>

            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium">
              {language === 'bn'
                ? 'সময়ের বাতিঘরের মানবিক সেবা ও উন্নয়ন কার্যক্রম পরিচালনাকারী বর্তমান কার্যনির্বাহী পরিষদ।'
                : 'Current governing council steering the humanitarian services of Somoyer Batighor.'}
            </p>
          </div>

          {isLoading && committeeMembers.length === 0 ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
            </div>
          ) : committeeMembers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{language === 'bn' ? 'কোন কমিটি সদস্য পাওয়া যায়নি' : 'No committee members found'}</p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {/* =========================================================================
                  DESKTOP VIEW: DIRECTOR -> 3 LEADERS -> 2 LEADERS -> EXECUTIVE COUNCIL
              ========================================================================= */}
              <div className="hidden md:block space-y-10">
                {/* 1. DIRECTOR (পরিচালক) - Single Person Centered at Top */}
                {director && (
                  <div className="flex flex-col items-center justify-center text-center pb-4">
                    <div className="w-full max-w-xs mx-auto">
                      <CommitteeCleanCard 
                        member={director} 
                        language={language} 
                        isDirector
                        onOpenInfo={() => setSelectedMember(director)} 
                      />
                    </div>
                  </div>
                )}

                {/* 2. Top Executive Leadership below Director */}
                {/* Row 1: Top 3 members (সভাপতি, সাধারণ সম্পাদক, ইত্যাদি) */}
                {top3Desktop.length > 0 && (
                  <div className="grid grid-cols-3 gap-8 lg:gap-14 max-w-4xl mx-auto items-start justify-items-center">
                    {top3Desktop.map((member) => (
                      <CommitteeCleanCard 
                        key={member.id} 
                        member={member} 
                        language={language} 
                        isTopLeader
                        onOpenInfo={() => setSelectedMember(member)} 
                      />
                    ))}
                  </div>
                )}

                {/* Row 2: Next 2 members (৪র্থ ও ৫ম জন) Centered in Middle */}
                {next2Desktop.length > 0 && (
                  <div className="flex justify-center items-start gap-12 lg:gap-16 max-w-2xl mx-auto pt-2">
                    {next2Desktop.map((member) => (
                      <div key={member.id} className="w-full max-w-[240px]">
                        <CommitteeCleanCard 
                          member={member} 
                          language={language} 
                          isTopLeader
                          onOpenInfo={() => setSelectedMember(member)} 
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Executive Council & Departmental Secretaries (বিভাগীয় দায়িত্বপ্রাপ্তবৃন্দ) */}
                {/* Automatically centered on desktop if 1, 2, 3 or more members */}
                {executiveCouncil.length > 0 && (
                  <div className="pt-10 border-t border-slate-100">
                    <div className="text-center mb-10">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs">
                        <ShieldCheck className="w-4 h-4 text-[#0B6B3A]" />
                        <span>{language === 'bn' ? 'কার্যনির্বাহী পরিষদ ও বিভাগীয় দায়িত্বপ্রাপ্তবৃন্দ' : 'Executive Council & Departmental Secretaries'}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center items-start gap-8 lg:gap-12 max-w-5xl mx-auto">
                      {executiveCouncil.map((member) => (
                        <div key={member.id} className="w-full max-w-[210px] sm:max-w-[220px]">
                          <CommitteeCleanCard 
                            member={member} 
                            language={language} 
                            isCouncil
                            onOpenInfo={() => setSelectedMember(member)} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================================
                  MOBILE VIEW: DIRECTOR / TOP LEADER ON TOP -> ALL OTHERS 2 PER ROW
              ========================================================================= */}
              <div className="block md:hidden space-y-8">
                {/* 1. Mobile Top: Director (or 1st top leader) Single & Centered */}
                {mobileTopLeader && (
                  <div className="max-w-[240px] mx-auto text-center px-2">
                    <CommitteeCleanCard 
                      member={mobileTopLeader} 
                      language={language} 
                      isDirector={mobileTopLeader.id === director?.id}
                      isTopLeader
                      isMobileTop
                      onOpenInfo={() => setSelectedMember(mobileTopLeader)} 
                    />
                  </div>
                )}

                {/* 2. Mobile Remaining Members: ALL paired in 2-column grid with comfortable middle spacing */}
                {mobileRemainingMembers.length > 0 && (
                  <div className="pt-2">
                    <div className="grid grid-cols-2 gap-x-7 sm:gap-x-9 gap-y-9 sm:gap-y-10 max-w-[340px] sm:max-w-md mx-auto items-start justify-items-center">
                      {mobileRemainingMembers.map((member) => (
                        <CommitteeCleanCard 
                          key={member.id} 
                          member={member} 
                          language={language} 
                          isTopLeader
                          onOpenInfo={() => setSelectedMember(member)} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          Professional Member Details Dossier Modal (Responsive with Prominent Close)
      ========================================================================= */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-0 max-h-[88vh] flex flex-col overflow-hidden rounded-3xl border border-emerald-500/30 shadow-2xl bg-white dark:bg-slate-950">
          {selectedMember && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Executive Header Banner */}
              <div className="bg-gradient-to-r from-[#0B6B3A] via-[#095A31] to-[#04331A] text-white p-6 pb-12 relative text-center shrink-0">
                {/* Prominent Close Button Top-Right */}
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center transition-all cursor-pointer z-30 shadow-md active:scale-95"
                  title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                >
                  <X className="w-4 h-4 stroke-[2.8]" />
                </button>

                {/* Left Header Tag */}
                <div className="absolute top-3.5 left-4">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
                    {selectedMember.position_bn?.includes('পরিচালক') 
                      ? (language === 'bn' ? 'পরিচালনা পরিষদ' : 'Directorate')
                      : (language === 'bn' ? 'কার্যনির্বাহী পরিষদ' : 'Executive Council')}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-emerald-200 tracking-wide uppercase mt-1">
                  {language === 'bn' ? 'সময়ের বাতিঘর ফাউন্ডেশন' : 'Somoyer Batighor Foundation'}
                </h4>
                <p className="text-[11px] text-white/70 mt-0.5">
                  {language === 'bn' ? 'সততা, মানবসেবা ও সামাজিক উন্নয়ন' : 'Dedicated to Humanitarian Service'}
                </p>
              </div>

              {/* Scrollable Dossier Body */}
              <div className="p-5 pt-0 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* Overlapping Photo & Main Info */}
                <div className="-mt-10 text-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl mx-auto bg-slate-50 relative z-10">
                    <img
                      src={selectedMember.photo_url || '/default-avatar-cap.svg'}
                      alt={selectedMember.name_bn}
                      style={{ objectPosition: 'center 20%' }}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar-cap.svg';
                      }}
                    />
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white leading-tight">
                      {language === 'bn' ? selectedMember.name_bn : (selectedMember.name_en || selectedMember.name_bn)}
                    </h3>
                    {selectedMember.name_en && language === 'bn' && (
                      <p className="text-xs text-slate-500 font-semibold">{selectedMember.name_en}</p>
                    )}
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-extrabold shadow-2xs">
                        {selectedMember.position_bn?.includes('পরিচালক') ? (
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>{language === 'bn' ? selectedMember.position_bn : (selectedMember.position_en || selectedMember.position_bn)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1. সংগঠনের ভূমিকা ও মূল দায়িত্ব (Role & Responsibilities) */}
                {selectedMemberRole && (
                  <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-xs">
                      <Briefcase className="w-4 h-4 text-[#0B6B3A]" />
                      <span>{language === 'bn' ? 'সংগঠনের ভূমিকা ও দায়িত্ব' : 'Role & Responsibilities'}:</span>
                      <span className="text-xs font-bold text-[#0B6B3A]">{selectedMemberRole.category}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1">
                      {selectedMemberRole.responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. Custom Bio / Short About Message */}
                {customDetailsMap?.[selectedMember.id]?.about && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{language === 'bn' ? 'পরিচিতি ও বার্তা' : 'About / Bio'}</span>
                    </div>
                    <p className="leading-relaxed italic pl-5 text-slate-600 dark:text-slate-400">
                      "{customDetailsMap[selectedMember.id].about}"
                    </p>
                  </div>
                )}

                {/* 3. পরিচিতি, এলাকা ও কার্যকাল (Origin, Area & Term) */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{language === 'bn' ? 'উৎস ও এলাকা' : 'Origin & Area'}</span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 pl-5">
                      {language === 'bn' ? 'নওগাঁ জেলা, বাংলাদেশ' : 'Naogaon, Bangladesh'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{language === 'bn' ? 'পরিষদ কার্যকাল' : 'Council Term'}</span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 pl-5">
                      {selectedMember.term_start 
                        ? `${new Date(selectedMember.term_start).getFullYear()} - ${selectedMember.term_end ? new Date(selectedMember.term_end).getFullYear() : 'চলমান'}`
                        : (language === 'bn' ? '২০২৪ - ২০২৬ পরিষদ' : '2024 - 2026 Term')}
                    </p>
                  </div>
                </div>

                {/* 4. যোগাযোগ অ্যাকশন: কল ও কপি বাটন */}
                {selectedMember.phone && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">{language === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm tracking-wide">{selectedMember.phone}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href={`tel:${selectedMember.phone}`}
                        className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0B6B3A] hover:bg-[#08522c] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'সরাসরি কল করুন' : 'Call Now'}</span>
                      </a>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => selectedMember.phone && handleCopyPhone(selectedMember.phone)}
                        className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 h-auto py-2.5"
                      >
                        {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />}
                        <span>{copiedPhone ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied') : (language === 'bn' ? 'নম্বর কপি' : 'Copy')}</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Additional Info: Member ID & Email */}
                {(selectedMember.member_id || selectedMember.email) && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                    {selectedMember.member_id && (
                      <div className="flex items-center justify-between">
                        <span>{language === 'bn' ? 'সদস্য পরিচিতি নম্বর:' : 'Member ID:'}</span>
                        <span className="font-mono font-bold text-[#0B6B3A]">{selectedMember.member_id}</span>
                      </div>
                    )}
                    {selectedMember.email && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{language === 'bn' ? 'ইমেইল:' : 'Email:'}</span>
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{selectedMember.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer with explicit Close Button */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                  className="rounded-xl border-slate-300 dark:border-slate-700 text-xs font-bold gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

interface CommitteeCleanCardProps {
  member: CommitteeMember;
  language: string;
  isDirector?: boolean;
  isTopLeader?: boolean;
  isMobileTop?: boolean;
  isCouncil?: boolean;
  onOpenInfo: () => void;
}

// Clean, borderless committee card with prominent circular photo, head protection and colorful (i) info button beside name
const CommitteeCleanCard: React.FC<CommitteeCleanCardProps> = ({
  member,
  language,
  isDirector,
  isTopLeader,
  isMobileTop,
  isCouncil,
  onOpenInfo,
}) => {
  const name = language === 'bn' ? member.name_bn : (member.name_en || member.name_bn);
  const position = language === 'bn' ? member.position_bn : (member.position_en || member.position_bn);
  const fallbackImage = '/default-avatar-cap.svg';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = fallbackImage;
  };

  // Prominent circular dimensions matching Homepage Committee Preview
  const imageSize = isDirector
    ? 'w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52'
    : isMobileTop
    ? 'w-36 h-36 sm:w-40 sm:h-40'
    : isCouncil
    ? 'w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40'
    : isTopLeader 
    ? 'w-30 h-30 sm:w-36 sm:h-36 md:w-44 md:h-44' 
    : 'w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36';

  return (
    <div className="text-center group flex flex-col items-center w-full">
      {/* Relative container for Circular Image + Badge Pill */}
      <div className="relative mb-3.5 inline-block shrink-0">
        {/* Round Image with elegant green/gold border - Guaranteed Perfect Circle */}
        <div className={`${imageSize} aspect-square rounded-full overflow-hidden border-4 ${
          isDirector
            ? 'border-[#0B6B3A] shadow-md ring-4 ring-[#9BD038]/30 group-hover:ring-[#9BD038]/60'
            : isTopLeader 
            ? 'border-[#0B6B3A]/40 group-hover:border-[#0B6B3A]' 
            : 'border-[#0B6B3A]/30 group-hover:border-[#0B6B3A]'
        } transition-all duration-300 mx-auto shadow-sm bg-slate-50 flex items-center justify-center shrink-0`}>
          <img
            src={member.photo_url || fallbackImage}
            alt={name}
            style={{ objectPosition: 'center 20%' }}
            className="w-full h-full object-cover aspect-square rounded-full group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
        </div>

        {/* Position Badge Pill at bottom of circle */}
        <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 sm:px-3.5 py-0.5 rounded-full text-white font-bold whitespace-nowrap shadow-xs flex items-center gap-1 ${
          isDirector
            ? 'bg-gradient-to-r from-[#0B6B3A] via-[#0e8045] to-[#14532d] text-xs sm:text-sm border border-amber-300'
            : isTopLeader 
            ? 'bg-[#0B6B3A] text-[11px] sm:text-xs' 
            : 'bg-slate-800 text-[10px] sm:text-xs'
        }`}>
          {isDirector && <Crown className="w-3 h-3 text-amber-300 shrink-0" />}
          <span>{position}</span>
        </div>
      </div>

      {/* Member Name Section with Distinctive Colorful (i) Button at Corner */}
      <div className="flex items-center justify-center gap-1.5 mt-1.5 max-w-full px-1">
        <h3 className={`font-heading font-extrabold text-slate-900 group-hover:text-[#0B6B3A] transition-colors leading-tight ${
          isDirector
            ? 'text-lg sm:text-2xl md:text-3xl'
            : isTopLeader 
            ? 'text-sm sm:text-base md:text-lg line-clamp-2' 
            : 'text-sm sm:text-base line-clamp-2'
        }`}>
          {name}
        </h3>

        {/* Colorful Golden-Amber (i) Button at Name Corner */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInfo();
          }}
          title={language === 'bn' ? 'বিস্তারিত তথ্য ও দায়িত্ব দেখুন' : 'View Profile & Role'}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 border border-amber-300 shadow-xs hover:shadow-md hover:scale-115 active:scale-90 transition-all shrink-0 cursor-pointer flex items-center justify-center"
        >
          <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.8]" />
        </button>
      </div>
    </div>
  );
};

export default Committee;
