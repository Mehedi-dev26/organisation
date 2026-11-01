import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Phone, 
  PhoneCall, 
  Loader2, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  Copy, 
  Check, 
  X,
  Mail,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CommitteeMember {
  id: string;
  name_bn: string;
  name_en: string | null;
  position_bn: string;
  position_en: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  sort_order: number | null;
  term_start?: string | null;
  term_end?: string | null;
  member_id?: string | null;
}

const Committee = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

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

  // Col 2: Cashier (ক্যাশিয়ার / কোষাধ্যক্ষ)
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
    });

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast({
      title: language === 'bn' ? 'নম্বর কপি সম্পন্ন' : 'Phone copied',
      description: phone,
    });
    setTimeout(() => setCopiedPhone(false), 2000);
  };

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
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {committeeMembers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{language === 'bn' ? 'কোন কমিটি সদস্য পাওয়া যায়নি' : 'No committee members found'}</p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {/* 1. TIER 1: President (Top, Centered, Prominent Round Photo, No Box/Button Background) */}
              {president && (
                <div className="max-w-md mx-auto text-center">
                  <CommitteeCleanCard 
                    member={president} 
                    language={language} 
                    isPresident 
                    onOpenInfo={() => setSelectedMember(president)} 
                  />
                </div>
              )}

              {/* 2. TIER 2: 3 Core Officers (General Secretary, Cashier, ICT Secretary) */}
              {/* Desktop: 3 Columns | Mobile: Neatly arranged together in 3 columns */}
              {tier2List.length > 0 && (
                <div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-8 max-w-xs sm:max-w-md md:max-w-4xl mx-auto items-start">
                    {tier2List.map((member) => (
                      <CommitteeCleanCard 
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

              {/* 3. TIER 3: Executive Members & Departmental Secretaries */}
              {/* Desktop: 4 per row | Mobile: 2 per row (Organizing, Office, Publicity, etc.) */}
              {executiveMembers.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-center mb-10">
                    <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-800">
                      {language === 'bn' ? 'কার্যনির্বাহী সদস্যবৃন্দ' : 'Executive Members'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      {language === 'bn' 
                        ? 'সাংগঠনিক, দপ্তর, প্রচার ও বিভিন্ন বিভাগীয় সম্পাদকীয় পরিষদ' 
                        : 'Departmental secretaries and executive council members'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto">
                    {executiveMembers.map((member) => (
                      <CommitteeCleanCard 
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
            </div>
          )}
        </div>
      </section>

      {/* Member Details Info Modal (Triggered by (i) button) */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl border-slate-200">
          {selectedMember && (
            <div className="text-center space-y-4">
              {/* Member Photo */}
              <div className="relative inline-block mx-auto">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#0B6B3A]/30 mx-auto shadow-md bg-slate-50">
                  <img
                    src={selectedMember.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedMember.name_bn)}`}
                    alt={selectedMember.name_bn}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Name & Title */}
              <div>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 leading-tight">
                  {language === 'bn' ? selectedMember.name_bn : (selectedMember.name_en || selectedMember.name_bn)}
                </h3>
                {selectedMember.name_en && language === 'bn' && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedMember.name_en}</p>
                )}
                <div className="mt-2.5 inline-block px-3.5 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
                  {language === 'bn' ? selectedMember.position_bn : (selectedMember.position_en || selectedMember.position_bn)}
                </div>
              </div>

              {/* Contact Actions: Call & Copy Button */}
              {selectedMember.phone ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                  <div className="text-xs text-slate-500 font-medium">
                    {language === 'bn' ? 'মোবাইল নম্বর:' : 'Phone Number:'}{' '}
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedMember.phone}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${selectedMember.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0B6B3A] hover:bg-[#08522c] text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectedMember.phone && handleCopyPhone(selectedMember.phone)}
                      className="rounded-xl border-slate-200 text-xs font-bold gap-1.5 hover:bg-slate-100"
                    >
                      {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPhone ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied') : (language === 'bn' ? 'কপি করুন' : 'Copy')}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {language === 'bn' ? 'মোবাইল নম্বর সংযুক্ত করা হয়নি' : 'Phone number not available'}
                </p>
              )}

              {/* Extra Details */}
              <div className="text-left text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span>{language === 'bn' ? 'সংগঠন:' : 'Organization:'}</span>
                  <span className="font-bold text-slate-800">সময়ের বাতিঘর</span>
                </div>
                {selectedMember.member_id && (
                  <div className="flex items-center justify-between">
                    <span>{language === 'bn' ? 'সদস্য আইডি:' : 'Member ID:'}</span>
                    <span className="font-mono font-bold text-[#0B6B3A]">{selectedMember.member_id}</span>
                  </div>
                )}
                {selectedMember.email && (
                  <div className="flex items-center justify-between">
                    <span>{language === 'bn' ? 'ইমেইল:' : 'Email:'}</span>
                    <span className="font-mono text-slate-700">{selectedMember.email}</span>
                  </div>
                )}
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
  isPresident?: boolean;
  isTier2?: boolean;
  isSmall?: boolean;
  onOpenInfo: () => void;
}

// Clean, borderless committee card matching original clean layout with (i) info button
const CommitteeCleanCard: React.FC<CommitteeCleanCardProps> = ({
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

  const imageSize = isPresident 
    ? 'w-32 h-32 sm:w-40 sm:h-40' 
    : isTier2 
    ? 'w-20 h-20 sm:w-28 sm:h-28' 
    : 'w-20 h-20 sm:w-24 sm:h-24';

  return (
    <div className="text-center group flex flex-col items-center">
      {/* Relative container for Circular Image + Badge + (i) Button */}
      <div className="relative mb-3.5 inline-block">
        {/* Round Image with elegant green border */}
        <div className={`${imageSize} rounded-full overflow-hidden border-4 ${
          isPresident ? 'border-[#0B6B3A]/40 group-hover:border-[#0B6B3A]' : 'border-[#0B6B3A]/20 group-hover:border-[#0B6B3A]'
        } transition-colors duration-300 mx-auto shadow-sm bg-slate-50`}>
          <img
            src={member.photo_url || fallbackImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
        </div>

        {/* Small (i) info icon button right beside the photo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInfo();
          }}
          title={language === 'bn' ? 'বিস্তারিত তথ্য দেখুন' : 'View Details'}
          className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-slate-600 hover:text-[#0B6B3A] border border-slate-200/90 shadow-md flex items-center justify-center transition-all hover:scale-110 z-10 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 stroke-[2.3]" />
        </button>

        {/* Position Badge Pill at bottom of circle */}
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 sm:px-3 py-0.5 rounded-full text-white font-bold whitespace-nowrap shadow-xs ${
          isPresident 
            ? 'bg-[#0B6B3A] text-xs' 
            : isTier2
            ? 'bg-[#0B6B3A] text-[10px] sm:text-xs'
            : 'bg-[#0B6B3A] text-[10px] sm:text-xs'
        }`}>
          {position}
        </div>
      </div>

      {/* Member Name */}
      <h3 className={`font-heading font-bold text-slate-900 group-hover:text-[#0B6B3A] transition-colors leading-tight mt-1 ${
        isPresident ? 'text-lg sm:text-2xl' : isTier2 ? 'text-xs sm:text-base line-clamp-2' : 'text-xs sm:text-sm line-clamp-1'
      }`}>
        {name}
      </h3>
    </div>
  );
};

export default Committee;
