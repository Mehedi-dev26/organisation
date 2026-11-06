import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Loader2, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  PhoneCall, 
  Info, 
  Copy, 
  Check, 
  Mail, 
  Calendar, 
  MapPin, 
  Briefcase,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getMemberRoleDetails, CommitteeMember, CommitteeCustomDetailsMap } from '@/lib/committeeUtils';

const CommitteePreview = () => {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Realtime subscription for instant auto-refresh
  useRealtimeSubscription({ table: 'committee_members', queryKey: ['home-committee-preview'] });

  // 1. Fetch active committee members ordered by sort_order
  const { data: committeeMembers = [], isLoading } = useQuery({
    queryKey: ['home-committee-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(20);
      
      if (error) {
        console.warn('Error fetching committee preview:', error);
        return [];
      }
      return (data || []) as CommitteeMember[];
    },
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });

  // 2. Fetch custom roles, responsibilities & about text from site_settings
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

  // Group members strictly according to layout specifications:
  // Top 5 Leaders: 1st, 2nd, 3rd, 4th, 5th
  const top5Leaders = committeeMembers.slice(0, 5);
  const top3Desktop = top5Leaders.slice(0, 3); // Desktop row 1: 3 members
  const next2Desktop = top5Leaders.slice(3, 5); // Desktop row 2: 2 members centered

  // Mobile: 1st alone on top, next 4 in 2x2 grid
  const mobileLeader1 = top5Leaders[0];
  const mobileNext4 = top5Leaders.slice(1, 5);

  // Remaining members from 6th onwards belong to Executive Council (কার্যনির্বাহী পরিষদ)
  const executiveCouncil = committeeMembers.slice(5);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast({
      title: language === 'bn' ? 'নম্বর কপি সম্পন্ন' : 'Phone copied',
      description: phone,
    });
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const customDetail = selectedMember ? customDetailsMap[selectedMember.id] : null;
  const selectedMemberRole = selectedMember 
    ? getMemberRoleDetails(selectedMember.position_bn, language, customDetail)
    : null;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden border-t border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Signature Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          {/* Top Pill Badge */}
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

          {/* Main Heading with Organic Leaf Strokes & Hand-Painted Underline */}
          <div className="inline-flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap mb-3">
            {/* Left Leaf Sparkle Strokes */}
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

            {/* Title */}
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              <span className="text-[#14231B] dark:text-slate-100">
                {language === 'bn' ? 'আমাদের ' : 'Executive '}
              </span>
              <span className="text-[#0B6B3A] relative inline-block">
                {language === 'bn' ? 'কার্যনির্বাহী কমিটি' : 'Committee'}
                {/* Yellow-Green Hand-Painted Brush Stroke Underline */}
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

            {/* Right Leaf Sparkle Strokes (Mirrored) */}
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
              ? 'সমাজসেবা, রক্তদান ও দারিদ্র্য দূরীকরণে নিবেদিত সময়ের বাতিঘর পরিবারের দায়িত্বশীল পরিষদ।'
              : 'Dedicated leadership council steering the humanitarian missions of Somoyer Batighor.'}
          </p>
        </div>

        {isLoading && committeeMembers.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
          </div>
        ) : committeeMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'bn' ? 'কোন কমিটি সদস্য পাওয়া যায়নি' : 'No committee members found'}
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            
            {/* =========================================================================
                SECTION 1: TOP 5 EXECUTIVE LEADERS (শীর্ষ ৫ জন কর্মকর্তা)
                Desktop: Row 1 = 3 members | Row 2 = 2 members centered
                Mobile:  1st member on top | Next 4 members in 2x2 centered grid
            ========================================================================= */}
            {top5Leaders.length > 0 && (
              <div className="space-y-6">
                {/* 1. Desktop Layout (hidden on mobile, visible on md and up) */}
                <div className="hidden md:block space-y-8">
                  {/* Row 1: Top 3 (1st, 2nd, 3rd) */}
                  {top3Desktop.length > 0 && (
                    <div className="grid grid-cols-3 gap-8 sm:gap-12 max-w-4xl mx-auto items-start justify-items-center">
                      {top3Desktop.map((member) => (
                        <HomeCommitteeCleanCard 
                          key={member.id} 
                          member={member} 
                          language={language} 
                          isTopLeader
                          onOpenInfo={() => setSelectedMember(member)} 
                        />
                      ))}
                    </div>
                  )}

                  {/* Row 2: Next 2 (4th, 5th) Centered Exactly in the Middle */}
                  {next2Desktop.length > 0 && (
                    <div className="flex justify-center items-start gap-12 sm:gap-16 max-w-2xl mx-auto">
                      {next2Desktop.map((member) => (
                        <div key={member.id} className="w-full max-w-[220px]">
                          <HomeCommitteeCleanCard 
                            member={member} 
                            language={language} 
                            isTopLeader
                            onOpenInfo={() => setSelectedMember(member)} 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Mobile Layout (visible on mobile, hidden on md and up) */}
                <div className="block md:hidden space-y-6">
                  {/* Mobile Row 1: 1st Member (President / 1st) Centered on Top */}
                  {mobileLeader1 && (
                    <div className="max-w-[220px] mx-auto text-center px-2">
                      <HomeCommitteeCleanCard 
                        member={mobileLeader1} 
                        language={language} 
                        isTopLeader
                        isMobileTop
                        onOpenInfo={() => setSelectedMember(mobileLeader1)} 
                      />
                    </div>
                  )}

                  {/* Mobile Row 2 & 3: Next 4 Members in 2x2 Centered Grid (2 per row) */}
                  {mobileNext4.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-7 max-w-xs sm:max-w-sm mx-auto items-start justify-items-center">
                      {mobileNext4.map((member) => (
                        <HomeCommitteeCleanCard 
                          key={member.id} 
                          member={member} 
                          language={language} 
                          isTopLeader
                          onOpenInfo={() => setSelectedMember(member)} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                SECTION 2: EXECUTIVE COUNCIL (কার্যনির্বাহী পরিষদ - ৬ নম্বর থেকে বাকী সবাই)
                Desktop: 4 columns | Mobile: 2 columns
            ========================================================================= */}
            {executiveCouncil.length > 0 && (
              <div className="pt-8 border-t border-slate-100">
                <div className="text-center mb-8 sm:mb-12">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B6B3A]" />
                    <span>{language === 'bn' ? 'কার্যনির্বাহী পরিষদ ও বিভাগীয় দায়িত্বপ্রাপ্তবৃন্দ' : 'Executive Council & Departmental Secretaries'}</span>
                  </span>
                </div>

                {/* 4 per row on Desktop, 2 per row on Mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 max-w-5xl mx-auto items-start justify-items-center">
                  {executiveCouncil.map((member) => (
                    <HomeCommitteeCleanCard 
                      key={member.id} 
                      member={member} 
                      language={language} 
                      isSmall 
                      onOpenInfo={() => setSelectedMember(member)} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* View Full Committee CTA Button */}
            <div className="text-center pt-6">
              <Button
                size="lg"
                asChild
                className="rounded-full px-7 py-3 bg-[#0B6B3A] hover:bg-[#08522c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all gap-2"
              >
                <Link to="/committee">
                  <span>{language === 'bn' ? 'সম্পূর্ণ কমিটি ও দায়িত্বপ্রাপ্ত সদস্যদের তালিকা' : 'View Full Committee Directory'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Professional Member Details Dossier Modal */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl">
          {selectedMember && (
            <div>
              {/* Executive Header Banner */}
              <div className="bg-gradient-to-r from-[#0B6B3A] via-[#095A31] to-[#04331A] text-white p-6 pb-12 relative text-center">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
                    {language === 'bn' ? 'কার্যনির্বাহী পরিষদ' : 'Executive Council'}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-emerald-200 tracking-wide uppercase">
                  {language === 'bn' ? 'সময়ের বাতিঘর ফাউন্ডেশন' : 'Somoyer Batighor Foundation'}
                </h4>
                <p className="text-[11px] text-white/70 mt-0.5">
                  {language === 'bn' ? 'সততা, মানবসেবা ও সামাজিক উন্নয়ন' : 'Dedicated to Humanitarian Service'}
                </p>
              </div>

              {/* Overlapping Photo & Main Info */}
              <div className="px-6 -mt-10 text-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto bg-slate-50 relative z-10 aspect-square">
                  <img
                    src={selectedMember.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedMember.name_bn)}`}
                    alt={selectedMember.name_bn}
                    className="w-full h-full object-cover rounded-full"
                    style={{ objectPosition: 'center 20%' }}
                  />
                </div>

                <div className="mt-3 space-y-1">
                  <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 leading-tight">
                    {language === 'bn' ? selectedMember.name_bn : (selectedMember.name_en || selectedMember.name_bn)}
                  </h3>
                  {selectedMember.name_en && language === 'bn' && (
                    <p className="text-xs text-slate-500 font-semibold">{selectedMember.name_en}</p>
                  )}
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-extrabold shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'bn' ? selectedMember.position_bn : (selectedMember.position_en || selectedMember.position_bn)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Dossier Body Content */}
              <div className="p-6 pt-4 space-y-4 max-h-[62vh] overflow-y-auto">
                {/* 1. সংগঠনের ভূমিকা ও মূল দায়িত্ব (Customized or Standard Role & Responsibilities) */}
                {selectedMemberRole && (
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                      <Briefcase className="w-4 h-4 text-[#0B6B3A]" />
                      <span>{language === 'bn' ? 'সংগঠনের ভূমিকা ও দায়িত্ব' : 'Role & Responsibilities'}:</span>
                      <span className="text-xs font-bold text-[#0B6B3A]">{selectedMemberRole.category}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600 pl-1">
                      {selectedMemberRole.responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. Custom About / Bio note if provided by Admin */}
                {customDetail?.about && customDetail.about.trim() && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-xs">
                      <FileText className="w-4 h-4 text-[#0B6B3A]" />
                      <span>{language === 'bn' ? 'সদস্য পরিচিতি ও বিশেষ ভূমিকা' : 'About & Contributions'}:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium pl-6">
                      {customDetail.about}
                    </p>
                  </div>
                )}

                {/* 3. পরিচিতি, এলাকা ও কার্যকাল (Origin, Area & Term) */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{language === 'bn' ? 'উৎস ও এলাকা' : 'Origin & Area'}</span>
                    </div>
                    <p className="font-semibold text-slate-800 pl-5">
                      {language === 'bn' ? 'নওগাঁ জেলা, বাংলাদেশ' : 'Naogaon, Bangladesh'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{language === 'bn' ? 'পরিষদ কার্যকাল' : 'Council Term'}</span>
                    </div>
                    <p className="font-semibold text-slate-800 pl-5">
                      {selectedMember.term_start 
                        ? `${new Date(selectedMember.term_start).getFullYear()} - ${selectedMember.term_end ? new Date(selectedMember.term_end).getFullYear() : 'চলমান'}`
                        : (language === 'bn' ? '২০২৬ - ২০২৭ পরিষদ' : '2026 - 2027 Term')}
                    </p>
                  </div>
                </div>

                {/* 4. যোগাযোগ অ্যাকশন: কল ও কপি বাটন */}
                {selectedMember.phone && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">{language === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}</span>
                      <span className="font-mono font-bold text-slate-900 text-sm tracking-wide">{selectedMember.phone}</span>
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
                        className="rounded-xl border-slate-200 text-xs font-bold gap-1.5 hover:bg-slate-100 h-auto py-2.5"
                      >
                        {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-700" />}
                        <span>{copiedPhone ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied') : (language === 'bn' ? 'নম্বর কপি' : 'Copy')}</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Additional Info: Member ID & Email */}
                {(selectedMember.member_id || selectedMember.email) && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
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
                        <span className="font-mono text-slate-700 truncate max-w-[200px]">{selectedMember.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

interface HomeCommitteeCleanCardProps {
  member: CommitteeMember;
  language: string;
  isTopLeader?: boolean;
  isMobileTop?: boolean;
  isSmall?: boolean;
  onOpenInfo: () => void;
}

// Clean, borderless committee card with prominent circular photo, head protection and colorful (i) info button beside name
const HomeCommitteeCleanCard: React.FC<HomeCommitteeCleanCardProps> = ({
  member,
  language,
  isTopLeader,
  isMobileTop,
  isSmall,
  onOpenInfo,
}) => {
  const name = language === 'bn' ? member.name_bn : (member.name_en || member.name_bn);
  const position = language === 'bn' ? member.position_bn : (member.position_en || member.position_bn);
  const fallbackImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name_bn)}`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = fallbackImage;
  };

  // Prominent circular dimensions for top leaders, with head framing
  const imageSize = isMobileTop
    ? 'w-36 h-36 sm:w-40 sm:h-40'
    : isTopLeader 
    ? 'w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40' 
    : 'w-24 h-24 sm:w-28 sm:h-28';

  return (
    <div className="text-center group flex flex-col items-center w-full">
      {/* Relative container for Circular Image + Badge Pill */}
      <div className="relative mb-3.5 inline-block shrink-0">
        {/* Round Image with elegant green border - Guaranteed Perfect Circle with Head Framing */}
        <div className={`${imageSize} aspect-square rounded-full overflow-hidden border-4 ${
          isTopLeader ? 'border-[#0B6B3A]/40 group-hover:border-[#0B6B3A]' : 'border-[#0B6B3A]/25 group-hover:border-[#0B6B3A]'
        } transition-colors duration-300 mx-auto shadow-sm bg-slate-50 flex items-center justify-center shrink-0`}>
          <img
            src={member.photo_url || fallbackImage}
            alt={name}
            className="w-full h-full object-cover aspect-square rounded-full group-hover:scale-105 transition-transform duration-300"
            style={{ objectPosition: 'center 20%' }}
            onError={handleImageError}
          />
        </div>

        {/* Position Badge Pill at bottom of circle */}
        <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 sm:px-3 py-0.5 rounded-full text-white font-bold whitespace-nowrap shadow-xs ${
          isTopLeader 
            ? 'bg-[#0B6B3A] text-[11px] sm:text-xs' 
            : 'bg-[#0B6B3A] text-[10px] sm:text-xs'
        }`}>
          {position}
        </div>
      </div>

      {/* Member Name Section with Distinctive Colorful (i) Button at Corner */}
      <div className="flex items-center justify-center gap-1.5 mt-1.5 max-w-full px-1">
        <h3 className={`font-heading font-extrabold text-slate-900 group-hover:text-[#0B6B3A] transition-colors leading-tight ${
          isTopLeader 
            ? 'text-sm sm:text-base md:text-lg line-clamp-2' 
            : 'text-xs sm:text-sm line-clamp-1'
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

export default CommitteePreview;
