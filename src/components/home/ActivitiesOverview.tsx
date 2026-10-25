import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  HandHeart, 
  CalendarDays, 
  User, 
  Heart, 
  Calendar, 
  ArrowRight, 
  Wheat,
  Sprout,
  Droplet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Import high-definition generated assets and graphics
import cardSapahar from '@/assets/activities/card-sapahar-hd.jpg';
import cardCommittee from '@/assets/activities/card-committee-hd.jpg';
import cardMembers from '@/assets/activities/card-members-hd.jpg';
import cardEvents from '@/assets/activities/card-events-hd.jpg';
import bgVillage from '@/assets/activities/bg-village.png';
import topLeaves from '@/assets/activities/top-leaves.png';
import topPin from '@/assets/activities/top-pin.png';


interface ActivityCard {
  id: string;
  title: string;
  titleSecondLine?: string;
  description: string;
  image: string;
  iconBg: string;
  accentColorHex: string;
  curveBorderColor: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  pillLabel: string;
  badgeKey: 'donors' | 'committee' | 'members' | 'events';
  badgeSuffix: string;
  hasWheat?: boolean;
  Icon: React.ElementType;
  PillIcon: React.ElementType;
  href: string; // real route destination
}

const activitiesData: ActivityCard[] = [
  {
    id: 'blood-donors',
    title: 'জরুরি রক্তদান',
    titleSecondLine: 'কর্মসূচি ও ব্যাংক',
    description: 'মুহূর্তের প্রয়োজনে রক্তের সন্ধান ও বিনামূল্যে রক্তদানের মানবিক সহায়তা সেবা।',
    image: cardSapahar,
    iconBg: 'bg-rose-600',
    accentColorHex: '#E11D48',
    curveBorderColor: 'border-rose-200',
    pillBg: 'bg-rose-50',
    pillText: 'text-rose-700',
    pillBorder: 'border-rose-200',
    pillLabel: 'রক্তদাতা খুঁজুন',
    badgeKey: 'donors',
    badgeSuffix: '+ রক্তদাতা প্রস্তুত',
    Icon: Droplet,
    PillIcon: Droplet,
    href: '/blood-donors', // Route: Emergency Blood Donors
  },
  {
    id: 'committee',
    title: 'কার্যনির্বাহী পরিষদ',
    titleSecondLine: 'ও নেতৃত্ব',
    description: 'সুশাসন, মানবিক সমাজ ও প্রাতিষ্ঠানিক উন্নয়নের লক্ষ্যে নিবেদিত পরিচালনা পরিষদ।',
    image: cardCommittee,
    iconBg: 'bg-[#0B6B3A]',
    accentColorHex: '#0B6B3A',
    curveBorderColor: 'border-[#A7F3D0]',
    pillBg: 'bg-[#EAF6ED]',
    pillText: 'text-[#0A5C34]',
    pillBorder: 'border-[#C8E6C9]',
    pillLabel: 'কমিটি বিস্তারিত',
    badgeKey: 'committee',
    badgeSuffix: ' জন পরিষদ সদস্য',
    Icon: UserCheck,
    PillIcon: Users,
    href: '/committee', // Route: Executive Committee
  },
  {
    id: 'members',
    title: 'আজীবন ও সাধারণ',
    titleSecondLine: 'সদস্যবৃন্দ',
    description: 'মানবতার সেবায় নিবেদিত আমাদের সকল সম্মানিত আজীবন ও সাধারণ সদস্যবৃন্দ।',
    image: cardMembers,
    iconBg: 'bg-[#F0A500]',
    accentColorHex: '#F0A500',
    curveBorderColor: 'border-[#FDE68A]',
    pillBg: 'bg-[#FFF6E5]',
    pillText: 'text-[#D97706]',
    pillBorder: 'border-[#FDE68A]',
    pillLabel: 'সদস্য তালিকা',
    badgeKey: 'members',
    badgeSuffix: '+ নিবন্ধিত সদস্য',
    hasWheat: true,
    Icon: HandHeart,
    PillIcon: Heart,
    href: '/members', // Route: Lifetime & General Members
  },
  {
    id: 'events',
    title: 'সেবামূলক কর্মসূচি',
    titleSecondLine: 'ও ত্রাণ কার্যক্রম',
    description: 'চিকিৎসা সহায়তা, শিক্ষা উপবৃত্তি ও দুর্যোগ মোকাবিলায় আমাদের মানবিক উদ্যোগসমূহ।',
    image: cardEvents,
    iconBg: 'bg-[#8A3FD1]',
    accentColorHex: '#8A3FD1',
    curveBorderColor: 'border-[#E9D5FF]',
    pillBg: 'bg-[#F6EEFD]',
    pillText: 'text-[#8A3FD1]',
    pillBorder: 'border-[#E9D5FF]',
    pillLabel: 'সকল উদ্যোগ',
    badgeKey: 'events',
    badgeSuffix: '+ সামাজিক কর্মসূচি',
    Icon: CalendarDays,
    PillIcon: Calendar,
    href: '/programs', // Route: Welfare Programs & Events
  },
];

const ActivitiesOverview: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['home-activities-stats'],
    queryFn: async () => {
      const [
        { count: donorsCount },
        { count: committeeCount },
        { count: membersCount },
        { count: eventsCount }
      ] = await Promise.all([
        supabase.from('blood_donors').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('committee_members').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
      ]);
      return {
        donors: donorsCount ?? 7,
        committee: committeeCount ?? 6,
        members: membersCount ?? 5,
        events: eventsCount ?? 6,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#F4FAF5] via-[#F8FCF9] to-[#FFFFFF] py-16 sm:py-20 lg:py-24 border-b border-emerald-950/5">
      {/* 1. Top-Left Floating Foliage/Leaves */}
      <div className="absolute top-0 left-0 w-24 sm:w-32 md:w-40 pointer-events-none select-none z-0 opacity-80 transition-opacity">
        <img 
          src={topLeaves} 
          alt="" 
          className="w-full h-auto object-contain"
        />
      </div>

      {/* 2. Top-Right Floating Green Map Pin with Leaf */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-6 md:top-6 md:right-8 w-14 sm:w-16 md:w-20 pointer-events-none select-none z-0 opacity-90 transition-opacity">
        <img 
          src={topPin} 
          alt="" 
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 lg:mb-16">
          {/* Top Pill Badge */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] shadow-xs">
              <span className="w-5 h-5 rounded-full bg-[#0B6B3A] flex items-center justify-center text-white flex-shrink-0">
                <Sprout className="w-3.5 h-3.5" />
              </span>
              <span className="text-[#0B6B3A] text-xs sm:text-sm font-semibold tracking-wide">
                সাপাহারের সেবা এখন আপনার হাতের মুঠোয়
              </span>
            </div>
          </div>

          {/* Main Heading with Organic Leaf Strokes & Hand-Painted Underline */}
          <div className="inline-flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap">
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              <span className="text-[#14231B]">এক নজরে </span>
              <span className="text-[#0B6B3A] relative inline-block">
                আমাদের কার্যক্রম
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
        </div>

        {/* 4 Cards Grid Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-7">
          {activitiesData.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.1)] border border-emerald-950/5 p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-2 group"
            >
              {/* Top Row: Icon Badge (Left) & Compact Curved Corner Photo (Top-Right) */}
              <div className="flex items-start justify-between relative mb-4 sm:mb-5">
                {/* Icon Badge */}
                <div 
                  className={cn(
                    "w-12 h-12 sm:w-13 sm:h-13 rounded-[16px] flex items-center justify-center text-white shadow-xs transition-transform duration-300 group-hover:scale-105 flex-shrink-0 z-10",
                    card.iconBg
                  )}
                >
                  <card.Icon className="w-6 h-6 sm:w-6.5 sm:h-6.5 stroke-[2.2]" />
                </div>

                {/* Top-Right Compact Corner Photo (Restrained to corner only) */}
                <div className="absolute top-0 right-0 w-24 sm:w-28 h-18 sm:h-20 pointer-events-none z-0">
                  <div 
                    className={cn(
                      "w-full h-full rounded-bl-[40px] border-b-2 border-l-2 p-0.5 overflow-hidden transition-transform duration-500 group-hover:scale-105 bg-white shadow-2xs",
                      card.curveBorderColor
                    )}
                  >
                    <img 
                      src={card.image} 
                      alt={card.title} 
                      className="w-full h-full object-cover rounded-bl-[38px]"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              {/* Live Count Badge & Title & Description */}
              <div className="mb-6 z-10">
                {/* Live Count Pill from Database */}
                <div 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2.5 w-fit border shadow-2xs"
                  style={{
                    backgroundColor: `${card.accentColorHex}12`,
                    color: card.accentColorHex,
                    borderColor: `${card.accentColorHex}30`
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: card.accentColorHex }} />
                  <span>
                    {stats?.[card.badgeKey] ?? '...'} {card.badgeSuffix}
                  </span>
                </div>

                <h3 className="text-xl sm:text-[21px] font-bold font-heading text-[#14231B] leading-snug mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                  {card.titleSecondLine && (
                    <>
                      <br className="hidden sm:inline" /> {card.titleSecondLine}
                    </>
                  )}
                </h3>
                <p className="text-sm sm:text-[14.5px] text-[#6B7A72] leading-relaxed font-normal">
                  {card.description}
                </p>
              </div>

              {/* Bottom Action Row: Clean Pill on Left, Round Arrow on Right */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-transparent z-10">
                {/* Clean Pill Button */}
                <Link
                  to={card.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-200 border hover:opacity-90 active:scale-95 whitespace-nowrap",
                    card.pillBg,
                    card.pillText,
                    card.pillBorder
                  )}
                >
                  <card.PillIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{card.pillLabel}</span>
                </Link>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Decorative Wheat for Card 3 */}
                  {card.hasWheat && (
                    <Wheat 
                      className="w-4 h-4 text-[#F0A500] opacity-80 hidden xs:inline-block" 
                      aria-hidden="true"
                    />
                  )}

                  {/* Circular Arrow Button with Soft Shadow */}
                  <Link
                    to={card.href}
                    className={cn(
                      "w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center text-white shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md flex-shrink-0",
                      card.iconBg
                    )}
                    aria-label={`${card.title} বিস্তারিত`}
                  >
                    <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              {/* Exact Bottom-Left Corner Curved Accent Arc from Reference Screenshot */}
              <svg 
                className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none z-10" 
                viewBox="0 0 32 32" 
                fill="none" 
                aria-hidden="true"
              >
                <path 
                  d="M0 32C0 14.327 14.327 0 32 0" 
                  stroke={card.accentColorHex} 
                  strokeWidth="5" 
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bottom Bangladeshi Rural Landscape Graphic */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-24 sm:h-32 md:h-40 pointer-events-none overflow-hidden select-none z-0">
        <img 
          src={bgVillage} 
          alt="" 
          className="w-full h-full object-cover object-bottom opacity-75 md:opacity-85" 
          style={{
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0.6) 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0.6) 70%, transparent 100%)'
          }}
        />
      </div>
    </section>
  );
};

export default ActivitiesOverview;
