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
  CheckCircle2 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getMemberRoleDetails, CommitteeMember } from '@/lib/committeeUtils';

const CommitteePreview = () => {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Realtime subscription for instant auto-refresh
  useRealtimeSubscription({ table: 'committee_members', queryKey: ['home-committee-preview'] });

  const { data: committeeMembers = [], isLoading } = useQuery({
    queryKey: ['home-committee-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(16);
      
      if (error) {
        console.warn('Error fetching committee preview:', error);
        return [];
      }
      return (data || []) as CommitteeMember[];
    },
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });

  // 1. President (Tier 1 - Top)
  const president = committeeMembers.find(m => 
    m.position_bn.includes('সভাপতি') && !m.position_bn.includes('সহ')
  ) || committeeMembers[0];

  // 2. Core Officers Triad (Tier 2 - 3 Columns):
  // Col 1: General Secretary or Vice President
  const generalSecretaryOrVp = committeeMembers.find(m => 
    m.id !== president?.id && (
      m.position_bn.includes('সাধারণ সম্পাদক') ||
      m.position_bn.includes('সহ-সভাপতি') ||
      m.position_bn.includes('সহসভাপতি') ||
      m.position_bn.includes('সচিব')
    )
  );

  // Col 2: Cashier (কোষাধ্যক্ষ / ক্যাশিয়ার)
  const cashierOrTreasurer = committeeMembers.find(m => 
    m.id !== president?.id && 
    m.id !== generalSecretaryOrVp?.id && (
      m.position_bn.includes('ক্যাশিয়ার') ||
      m.position_bn.toLowerCase().includes('cashier') ||
      m.position_bn.includes('কোষাধ্যক্ষ') ||
      m.position_bn.includes('অর্থ')
    )
  );

  // Col 3: ICT & IT Secretary (তথ্যপ্রযুক্তি / আইসিটি)
  const ictSecretary = committeeMembers.find(m => 
    m.id !== president?.id && 
    m.id !== generalSecretaryOrVp?.id && 
    m.id !== cashierOrTreasurer?.id && (
      m.position_bn.includes('তথ্যপ্রযুক্তি') ||
      m.position_bn.toLowerCase().includes('ict') ||
      m.position_bn.includes('আইসিটি') ||
      m.position_bn.includes('যুগ্ম') ||
      m.position_bn.includes('সহ-সাধারণ সম্পাদক')
    )
  );

  const tier2List = [generalSecretaryOrVp, cashierOrTreasurer, ictSecretary].filter(Boolean) as CommitteeMember[];

  // 3. Tier 3: Executive Members & Departmental Secretaries (Organizing, Office, Publicity, etc.)
  const assignedIds = new Set([
    president?.id,
    generalSecretaryOrVp?.id,
    cashierOrTreasurer?.id,
    ictSecretary?.id,
  ].filter(Boolean));

  const executiveMembers = committeeMembers
    .filter(m => !assignedIds.has(m.id))
    .sort((a, b) => {
      const getPriority = (pos: string) => {
        if (pos.includes('সাংগঠনিক')) return 1;
        if (pos.includes('দপ্তর')) return 2;
        if (pos.includes('প্রচার')) return 3;
        if (pos.includes('রক্তদান')) return 4;
        if (pos.includes('সমাজকল্যাণ')) return 5;
        if (pos.includes('শিক্ষা')) return 6;
        if (pos.includes('সাংস্কৃতিক')) return 7;
        return 10;
      };
      const pA = getPriority(a.position_bn);
      const pB = getPriority(b.position_bn);
      if (pA !== pB) return pA - pB;
      return (a.sort_order || 99) - (b.sort_order || 99);
    })
    .slice(0, 8); // Display 8 members on homepage for a balanced grid

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
    ? getMemberRoleDetails(selectedMember.position_bn, language)
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
          <div className="space-y-12 sm:space-y-18">
            {/* 1. TIER 1: President (Top, Centered, Prominent Round Photo, Spaced Out & Clean) */}
            {president && (
              <div className="max-w-md mx-auto text-center px-4">
                <HomeCommitteeCleanCard 
                  member={president} 
                  language={language} 
                  isPresident 
                  onOpenInfo={() => setSelectedMember(president)} 
                />
              </div>
            )}

            {/* 2. TIER 2: 3 Core Officers (General Secretary, Cashier, ICT Secretary) */}
            {/* Desktop: 3 Columns | Mobile: Enlarged images with generous breathing room */}
            {tier2List.length > 0 && (
              <div className="py-2">
                <div className="grid grid-cols-3 gap-3.5 sm:gap-10 max-w-sm sm:max-w-md md:max-w-4xl mx-auto items-start">
                  {tier2List.map((member) => (
                    <HomeCommitteeCleanCard 
                      key={member.id} 
                      member={member} 
                      language={language} 
                      isTier2 
                      onOpenInfo={() => setSelectedMember(member)} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. TIER 3: Executive Members & Departmental Secretaries (Desktop 4 per row, Mobile 2 per row) */}
            {executiveMembers.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="text-center mb-8 sm:mb-12">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B6B3A]" />
                    <span>{language === 'bn' ? 'কার্যনির্বাহী পরিষদ ও বিভাগীয় সম্পাদকবৃন্দ' : 'Executive Council & Secretaries'}</span>
                  </span>
                </div>

                {/* 4 per row on Desktop, 2 per row on Mobile with larger photos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 max-w-5xl mx-auto">
                  {executiveMembers.map((member) => (
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
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto bg-slate-50 relative z-10">
                  <img
                    src={selectedMember.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedMember.name_bn)}`}
                    alt={selectedMember.name_bn}
                    className="w-full h-full object-cover"
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
                {/* 1. সংগঠনের ভূমিকা ও মূল দায়িত্ব (Role & Responsibilities) */}
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

                {/* 2. পরিচিতি, এলাকা ও কার্যকাল (Origin, Area & Term) */}
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

                {/* 3. যোগাযোগ অ্যাকশন: কল ও কপি বাটন */}
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
  isPresident?: boolean;
  isTier2?: boolean;
  isSmall?: boolean;
  onOpenInfo: () => void;
}

// Clean, borderless committee card with larger photos on mobile and colorful (i) info button beside name
const HomeCommitteeCleanCard: React.FC<HomeCommitteeCleanCardProps> = ({
  member,
  language,
  isPresident,
  isTier2,
  isSmall,
  onOpenInfo,
}) => {
  const name = language === 'bn' ? member.name_bn : (member.name_en || member.name_bn);
  const position = language === 'bn' ? member.position_bn : (member.position_en || member.position_bn);
  const fallbackImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name_bn)}`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = fallbackImage;
  };

  // Exact standard Tailwind dimensions with aspect-square to guarantee 100% perfect circle
  const imageSize = isPresident 
    ? 'w-36 h-36 sm:w-44 sm:h-44' 
    : isTier2 
    ? 'w-24 h-24 sm:w-28 sm:h-28' 
    : 'w-28 h-28 sm:w-32 sm:h-32';

  return (
    <div className="text-center group flex flex-col items-center">
      {/* Relative container for Circular Image + Badge Pill */}
      <div className="relative mb-3.5 inline-block shrink-0">
        {/* Round Image with elegant green border - Guaranteed Perfect Circle */}
        <div className={`${imageSize} aspect-square rounded-full overflow-hidden border-4 ${
          isPresident ? 'border-[#0B6B3A]/40 group-hover:border-[#0B6B3A]' : 'border-[#0B6B3A]/25 group-hover:border-[#0B6B3A]'
        } transition-colors duration-300 mx-auto shadow-sm bg-slate-50 flex items-center justify-center shrink-0`}>
          <img
            src={member.photo_url || fallbackImage}
            alt={name}
            className="w-full h-full object-cover object-center aspect-square rounded-full group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
        </div>

        {/* Position Badge Pill at bottom of circle */}
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 sm:px-3 py-0.5 rounded-full text-white font-bold whitespace-nowrap shadow-xs ${
          isPresident 
            ? 'bg-[#0B6B3A] text-xs sm:text-sm' 
            : isTier2
            ? 'bg-[#0B6B3A] text-[10px] sm:text-xs'
            : 'bg-[#0B6B3A] text-[10px] sm:text-xs'
        }`}>
          {position}
        </div>
      </div>

      {/* Member Name Section with Distinctive Colorful (i) Button at Corner */}
      <div className="flex items-center justify-center gap-1.5 mt-1.5 max-w-full px-1">
        <h3 className={`font-heading font-extrabold text-slate-900 group-hover:text-[#0B6B3A] transition-colors leading-tight ${
          isPresident 
            ? 'text-lg sm:text-2xl' 
            : isTier2 
            ? 'text-xs sm:text-base line-clamp-2' 
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
