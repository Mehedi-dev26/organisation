import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2, Award, Sparkles, ShieldCheck, ArrowRight, PhoneCall } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CommitteeMember {
  id: string;
  name_bn: string;
  name_en: string | null;
  position_bn: string;
  position_en: string | null;
  photo_url: string | null;
  phone: string | null;
  sort_order: number | null;
}

const CommitteePreview = () => {
  const { language } = useLanguage();

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
    staleTime: 1000 * 60 * 5,
  });

  // 1. President (Tier 1 - Top)
  const president = committeeMembers.find(m => 
    m.position_bn.includes('সভাপতি') && !m.position_bn.includes('সহ')
  ) || committeeMembers[0];

  // 2. Core Officers Triad (Tier 2 - 3 Columns on Desktop):
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
    .slice(0, 8); // Display 4 or 8 members on homepage for a balanced grid

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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
          </div>
        ) : committeeMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'bn' ? 'কোন কমিটি সদস্য পাওয়া যায়নি' : 'No committee members found'}
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-14">
            {/* 1. TIER 1: President Card (Top, Centered, Prominent) */}
            {president && (
              <div className="max-w-md sm:max-w-lg mx-auto">
                <div className="text-center mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'bn' ? 'শীর্ষ নেতৃত্ব' : 'Supreme Leadership'}</span>
                  </span>
                </div>
                <HomeCommitteeCard member={president} language={language} isPresident />
              </div>
            )}

            {/* 2. TIER 2: 3 Columns on Desktop: সাধারণ সম্পাদক/সহ-সভাপতি | ক্যাশিয়ার | আইসিটি সম্পাদক */}
            {tier2List.length > 0 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                  {tier2List.map((member) => (
                    <HomeCommitteeCard key={member.id} member={member} language={language} isTier2 />
                  ))}
                </div>
              </div>
            )}

            {/* 3. TIER 3: Executive Members & Departmental Secretaries (Desktop 4 per row, Mobile 2 per row) */}
            {executiveMembers.length > 0 && (
              <div>
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B6B3A]" />
                    <span>{language === 'bn' ? 'কার্যনির্বাহী পরিষদ ও বিভাগীয় সম্পাদকবৃন্দ' : 'Executive Council & Secretaries'}</span>
                  </span>
                </div>

                {/* 4 per row on Desktop, 2 per row on Mobile */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 max-w-6xl mx-auto">
                  {executiveMembers.map((member) => (
                    <HomeCommitteeCard key={member.id} member={member} language={language} isSmall />
                  ))}
                </div>
              </div>
            )}

            {/* View Full Committee CTA Button */}
            <div className="text-center pt-2">
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
    </section>
  );
};

interface HomeCommitteeCardProps {
  member: CommitteeMember;
  language: string;
  isPresident?: boolean;
  isTier2?: boolean;
  isSmall?: boolean;
}

const HomeCommitteeCard: React.FC<HomeCommitteeCardProps> = ({
  member,
  language,
  isPresident,
  isTier2,
  isSmall,
}) => {
  const name = language === 'bn' ? member.name_bn : (member.name_en || member.name_bn);
  const position = language === 'bn' ? member.position_bn : (member.position_en || member.position_bn);
  const fallbackImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name_bn)}`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = fallbackImage;
  };

  const imageSize = isPresident 
    ? 'w-28 h-28 sm:w-36 sm:h-36' 
    : isTier2 
    ? 'w-24 h-24 sm:w-28 sm:h-28' 
    : 'w-18 h-18 sm:w-22 sm:h-22';

  return (
    <div className={`group bg-white rounded-[22px] p-4 sm:p-5 border transition-all duration-300 hover:-translate-y-1 text-center flex flex-col justify-between relative ${
      isPresident 
        ? 'border-emerald-300 shadow-[0_10px_35px_rgba(11,107,58,0.10)] ring-2 ring-emerald-500/20' 
        : isTier2
        ? 'border-slate-200 shadow-[0_6px_25px_rgba(0,0,0,0.04)] hover:border-emerald-300 hover:shadow-md'
        : 'border-slate-100 shadow-[0_4px_18px_rgba(0,0,0,0.02)] hover:border-emerald-200 hover:shadow-sm'
    }`}>
      <div>
        <div className="relative mb-3.5 inline-block">
          <div className={`${imageSize} rounded-full overflow-hidden border-4 ${
            isPresident ? 'border-amber-400' : 'border-[#0B6B3A]/30 group-hover:border-[#0B6B3A]'
          } transition-colors duration-300 mx-auto shadow-sm bg-slate-50`}>
            <img
              src={member.photo_url || fallbackImage}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
            />
          </div>

          {/* Designation Badge */}
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-white text-[10px] sm:text-xs font-bold whitespace-nowrap shadow-sm ${
            isPresident 
              ? 'bg-gradient-to-r from-amber-600 to-amber-700 ring-2 ring-white' 
              : 'bg-[#0B6B3A] group-hover:bg-[#08522c]'
          }`}>
            {position}
          </div>
        </div>

        {/* Member Name */}
        <h3 className={`font-heading font-extrabold text-[#14231B] mt-0.5 group-hover:text-[#0B6B3A] transition-colors leading-snug ${
          isPresident ? 'text-lg sm:text-xl' : isTier2 ? 'text-sm sm:text-base' : 'text-xs sm:text-sm line-clamp-1'
        }`}>
          {name}
        </h3>
      </div>

      {/* Phone Call Link if Available */}
      {member.phone && (
        <div className="mt-2.5 pt-2 border-t border-slate-100">
          <a
            href={`tel:${member.phone}`}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#0B6B3A] text-[#0B6B3A] hover:text-white transition-all text-[11px] font-bold border border-emerald-200/80 w-full shadow-2xs"
          >
            <PhoneCall className="w-3 h-3 shrink-0" />
            <span className="truncate">{member.phone}</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default CommitteePreview;
