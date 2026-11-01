import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, PhoneCall, Loader2, Award, Sparkles, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

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

const Committee = () => {
  const { t, language } = useLanguage();

  // Enable realtime subscription
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

  // 3. Tier 3: Executive Members & Other Departmental Secretaries
  const assignedIds = new Set([
    president?.id,
    generalSecretaryOrVp?.id,
    cashierOrTreasurer?.id,
    ictSecretary?.id,
  ].filter(Boolean));

  // Prioritize: সাংগঠনিক সম্পাদক, দপ্তর সম্পাদক, প্রচার সম্পাদক, তারপর বাকিরা
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
    });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
        </div>
      </MainLayout>
    );
  }

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
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {committeeMembers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs max-w-md mx-auto">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 text-lg mb-1">
                {language === 'bn' ? 'কোন কমিটি সদস্য পাওয়া যায়নি' : 'No committee members found'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'শীঘ্রই নতুন কমিটির তথ্য হালনাগাদ করা হবে।' : 'Committee data will be updated soon.'}
              </p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {/* 1. TIER 1: President Card (Top, Centered, Prominent) */}
              {president && (
                <div className="max-w-md sm:max-w-lg mx-auto">
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'bn' ? 'শীর্ষ নেতৃত্ব' : 'Supreme Leadership'}</span>
                    </span>
                  </div>
                  <CommitteeMemberCard member={president} language={language} isPresident />
                </div>
              )}

              {/* 2. TIER 2: 3 Core Columns on Desktop: সাধারণ সম্পাদক/সহ-সভাপতি | ক্যাশিয়ার | আইসিটি সম্পাদক */}
              {tier2List.length > 0 && (
                <div>
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                      <Award className="w-3.5 h-3.5 text-[#0B6B3A]" />
                      <span>{language === 'bn' ? 'প্রধান কর্মকর্তাবৃন্দ' : 'Principal Officers'}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {tier2List.map((member) => (
                      <CommitteeMemberCard key={member.id} member={member} language={language} isTier2 />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. TIER 3: Executive Members & Departmental Secretaries (Desktop 4 per row, Mobile 2 per row) */}
              {executiveMembers.length > 0 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold mb-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'কার্যনির্বাহী পরিষদ' : 'Executive Council'}</span>
                    </div>
                    <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#14231B] tracking-tight">
                      {language === 'bn' ? 'কার্যনির্বাহী সদস্যবৃন্দ ও বিভাগীয় সম্পাদকবৃন্দ' : 'Executive Members & Departmental Secretaries'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
                      {language === 'bn' 
                        ? 'সাংগঠনিক, দপ্তর, প্রচার এবং বিভিন্ন বিভাগীয় সম্পাদকমণ্ডলী ও সদস্যবৃন্দ' 
                        : 'Organizing, office, publicity and departmental secretarial committee'}
                    </p>
                  </div>

                  {/* 4 Cards per row on Desktop, 2 Cards per row on Mobile */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 max-w-6xl mx-auto">
                    {executiveMembers.map((member) => (
                      <CommitteeMemberCard key={member.id} member={member} language={language} isSmall />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

interface CommitteeMemberCardProps {
  member: CommitteeMember;
  language: string;
  isPresident?: boolean;
  isTier2?: boolean;
  isSmall?: boolean;
}

const CommitteeMemberCard: React.FC<CommitteeMemberCardProps> = ({
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
    ? 'w-32 h-32 sm:w-40 sm:h-40' 
    : isTier2 
    ? 'w-24 h-24 sm:w-28 sm:h-28' 
    : 'w-20 h-20 sm:w-24 sm:h-24';

  return (
    <div className={`group bg-white rounded-[22px] p-4 sm:p-6 border transition-all duration-300 hover:-translate-y-1 text-center flex flex-col justify-between relative ${
      isPresident 
        ? 'border-emerald-300 shadow-[0_12px_40px_rgba(11,107,58,0.12)] ring-2 ring-emerald-500/20' 
        : isTier2
        ? 'border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:border-emerald-300 hover:shadow-lg'
        : 'border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-emerald-200 hover:shadow-md'
    }`}>
      <div>
        {/* Photo with Ring */}
        <div className="relative mb-4 inline-block">
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

          {/* Position Badge Pill */}
          <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] sm:text-xs font-bold whitespace-nowrap shadow-sm ${
            isPresident 
              ? 'bg-gradient-to-r from-amber-600 to-amber-700 ring-2 ring-white' 
              : 'bg-[#0B6B3A] group-hover:bg-[#08522c]'
          }`}>
            {position}
          </div>
        </div>

        {/* Member Name */}
        <h3 className={`font-heading font-extrabold text-[#14231B] mt-1 group-hover:text-[#0B6B3A] transition-colors leading-snug ${
          isPresident ? 'text-xl sm:text-2xl' : isTier2 ? 'text-base sm:text-lg' : 'text-xs sm:text-base line-clamp-1'
        }`}>
          {name}
        </h3>
      </div>

      {/* Phone Call Link if Available */}
      {member.phone && (
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <a
            href={`tel:${member.phone}`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#0B6B3A] text-[#0B6B3A] hover:text-white transition-all text-xs font-bold border border-emerald-200/80 w-full shadow-2xs"
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{member.phone}</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default Committee;
