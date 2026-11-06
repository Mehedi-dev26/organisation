import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, 
  GraduationCap, 
  HandHeart, 
  Trees, 
  Droplet, 
  BookOpen, 
  Heart, 
  Sprout, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  X,
  PhoneCall,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/services/siteSettingsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Import high-definition generated assets and graphics
import cardSapahar from '@/assets/activities/card-sapahar-hd.jpg';
import cardCommittee from '@/assets/activities/card-committee-hd.jpg';
import cardMembers from '@/assets/activities/card-members-hd.jpg';
import cardEvents from '@/assets/activities/card-events-hd.jpg';
import bgVillage from '@/assets/activities/bg-village.png';
import topLeaves from '@/assets/activities/top-leaves.png';
import topPin from '@/assets/activities/top-pin.png';

export interface ActivityCard {
  id: string;
  serialNumberBn: string;
  serialNumberEn: string;
  categoryBn: string;
  categoryEn: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  keyPointsBn: string[];
  keyPointsEn: string[];
  tagsBn: string[];
  tagsEn: string[];
  image: string;
  iconBg: string;
  accentColorHex: string;
  curveBorderColor: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  pillLabelBn: string;
  pillLabelEn: string;
  focusBadgeBn: string;
  focusBadgeEn: string;
  Icon: React.ElementType;
  PillIcon: React.ElementType;
  href: string;
}

export const activitiesData: ActivityCard[] = [
  {
    id: 'health-aid',
    serialNumberBn: '১',
    serialNumberEn: '1',
    categoryBn: 'স্বাস্থ্য সহায়তা কার্যক্রম',
    categoryEn: 'Healthcare Support Initiative',
    titleBn: 'সুবিধাবঞ্চিত মানুষের জন্য প্রাথমিক স্বাস্থ্যসেবা ও সচেতনতা',
    titleEn: 'Primary Healthcare & Awareness for Underprivileged People',
    descriptionBn: 'সমাজের সাধারণ মানুষের মাঝে স্বাস্থ্য সচেতনতা সৃষ্টি, রক্তদান কার্যক্রম, ব্লাড গ্রুপ ও প্রেসার নির্ণয় এবং বিনামূল্যে প্রাথমিক চিকিৎসাসেবা নিশ্চিত করা হয়। পাশাপাশি তরুণ প্রজন্মকে রক্ষায় নিয়মিত মাদক বিরোধী কর্মসূচি পরিচালনা করা এই কার্যক্রমের অন্যতম লক্ষ্য।',
    descriptionEn: 'Creating health awareness among the general public, organizing blood donation drives, blood grouping and blood pressure screening, and ensuring free primary medical care. Additionally, conducting regular anti-drug campaigns to protect the youth is one of the primary objectives.',
    keyPointsBn: [
      'সাধারণ মানুষের মাঝে নিয়মিত স্বাস্থ্য সচেতনতা সৃষ্টি ও ক্যাম্পেইন',
      'জরুরি রক্তদান কার্যক্রম, রক্তদাতা ব্যাংক ও ব্লাড গ্রুপ নির্ণয়',
      'বিনামূল্যে প্রাথমিক চিকিৎসাসেবা ও প্রেসার পরিমাপ নিশ্চিতকরণ',
      'তরুণ প্রজন্মকে ধ্বংসের হাত থেকে রক্ষায় নিয়মিত মাদক বিরোধী কর্মসূচি'
    ],
    keyPointsEn: [
      'Regular health awareness creation and community camps',
      'Emergency blood donation drives, blood bank & group screening',
      'Free primary medical consultation & regular blood pressure checks',
      'Regular anti-drug campaigns to protect and guide the youth'
    ],
    tagsBn: ['রক্তদান ও ফ্রি ক্যাম্প', 'মাদক বিরোধী কর্মসূচি'],
    tagsEn: ['Blood Donation & Camp', 'Anti-Drug Campaign'],
    image: cardSapahar,
    iconBg: 'bg-rose-600',
    accentColorHex: '#E11D48',
    curveBorderColor: 'border-rose-200',
    pillBg: 'bg-rose-50',
    pillText: 'text-rose-700',
    pillBorder: 'border-rose-200',
    pillLabelBn: 'বিস্তারিত দেখুন',
    pillLabelEn: 'View Details',
    focusBadgeBn: 'প্রাথমিক স্বাস্থ্য ও সচেতনতা',
    focusBadgeEn: 'Primary Healthcare',
    Icon: HeartPulse,
    PillIcon: Droplet,
    href: '/blood-donors',
  },
  {
    id: 'education-aid',
    serialNumberBn: '২',
    serialNumberEn: '2',
    categoryBn: 'শিক্ষা সহায়তা কার্যক্রম',
    categoryEn: 'Educational Assistance Initiative',
    titleBn: 'সার্বিক সাক্ষরতা, দ্বীনি শিক্ষা ও অসচ্ছল শিক্ষার্থীদের পাশে দাঁড়ানো',
    titleEn: 'Universal Literacy, Moral Education & Student Support',
    descriptionBn: 'তৃণমূল পর্যায়ে শিক্ষার আলো ছড়িয়ে দিতে মক্তব ও গণশিক্ষা কার্যক্রম চালু করা এবং পাঠাভ্যাস তৈরিতে লাইব্রেরি প্রতিষ্ঠা করা হয়। একই সাথে সুবিধাবঞ্চিত ও অসচ্ছল পরিবারের শিক্ষার্থীদের লেখাপড়া অব্যাহত রাখতে প্রয়োজনীয় সহযোগিতা প্রদান করা হয়।',
    descriptionEn: 'Launching maktab and mass education programs to spread the light of knowledge at the grassroots level, and establishing libraries to foster reading habits. Concurrently, providing essential financial and material support to underprivileged students to keep their education ongoing.',
    keyPointsBn: [
      'তৃণমূল পর্যায়ে সার্বিক সাক্ষরতা ও দ্বীনি শিক্ষা বিস্তার',
      'মক্তব ও গণশিক্ষা কার্যক্রম চালু ও পরিচালনা',
      'তরুণ ও শিশুদের পাঠাভ্যাস গড়ে তুলতে লাইব্রেরি প্রতিষ্ঠা',
      'সুবিধাবঞ্চিত ও অসচ্ছল পরিবারের শিক্ষার্থীদের শিক্ষা উপকরণ ও সহায়তা'
    ],
    keyPointsEn: [
      'Universal literacy and moral education at the grassroots level',
      'Launching and maintaining maktab & community adult education',
      'Establishing libraries to build reading habits among youths',
      'Educational supplies & financial aid for underprivileged students'
    ],
    tagsBn: ['মক্তব ও গণশিক্ষা', 'লাইব্রেরি প্রতিষ্ঠা'],
    tagsEn: ['Mass Education', 'Community Library'],
    image: cardMembers,
    iconBg: 'bg-[#0B6B3A]',
    accentColorHex: '#0B6B3A',
    curveBorderColor: 'border-[#A7F3D0]',
    pillBg: 'bg-[#EAF6ED]',
    pillText: 'text-[#0A5C34]',
    pillBorder: 'border-[#C8E6C9]',
    pillLabelBn: 'বিস্তারিত দেখুন',
    pillLabelEn: 'View Details',
    focusBadgeBn: 'গণশিক্ষা ও পাঠাগার',
    focusBadgeEn: 'Education & Library',
    Icon: GraduationCap,
    PillIcon: BookOpen,
    href: '/programs',
  },
  {
    id: 'social-welfare',
    serialNumberBn: '৩',
    serialNumberEn: '3',
    categoryBn: 'সমাজকল্যাণ ও দারিদ্র্য দূরীকরণ কার্যক্রম',
    categoryEn: 'Social Welfare & Poverty Alleviation',
    titleBn: 'অসহায় মানুষের মৌলিক চাহিদা পূরণ ও কল্যাণমূলক আর্থিক সহায়তা',
    titleEn: 'Basic Needs Fulfillment & Welfare Financial Support',
    descriptionBn: 'সমাজের অসহায়, দরিদ্র, বিধবা ও এতিমদের প্রয়োজনীয় চাহিদা অনুযায়ী আর্থিক ও অন্যান্য সহায়তা দেওয়া হয়। পাশাপাশি মানুষকে স্বাবলম্বী করতে বিনাসুদে ঋণ (করযে হাসানা) প্রদান এবং ভিন্ন ধর্মাবলম্বীদের মাঝেও মানবিক কল্যাণমূলক কাজ পরিচালনা করা হয়।',
    descriptionEn: 'Providing monetary and material aid according to the urgent needs of helpless, impoverished, widowed, and orphaned individuals. Offering interest-free micro-loans (Qard Hasan) for self-reliance and extending humanitarian goodwill to people of all faiths.',
    keyPointsBn: [
      'সমাজের অসহায়, দরিদ্র, বিধবা ও এতিমদের প্রয়োজনীয় আর্থিক সহায়তা',
      'কর্মসংস্থান ও স্বাবলম্বী করার লক্ষ্যে বিনাসুদে ঋণ (করযে হাসানা) প্রদান',
      'জাতি-ধর্ম নির্বিশেষে ভিন্ন ধর্মাবলম্বীদের মাঝেও মানবিক কল্যাণ সাধন',
      'জরুরি সংকট মোকাবিলায় মৌলিক খাদ্য ও বস্ত্র সহায়তা বিতরণ'
    ],
    keyPointsEn: [
      'Financial aid for helpless, poor, widows, and orphans',
      'Interest-free loans (Qard Hasan) for sustainable self-reliance',
      'Humanitarian welfare work for people of all religious faiths',
      'Food packages and clothing support for acute basic needs'
    ],
    tagsBn: ['করযে হাসানা (বিনাসুদে ঋণ)', 'অসহায় ও এতিম সহায়তা'],
    tagsEn: ['Interest-Free Loan', 'Orphan & Widow Support'],
    image: cardCommittee,
    iconBg: 'bg-[#D97706]',
    accentColorHex: '#D97706',
    curveBorderColor: 'border-[#FDE68A]',
    pillBg: 'bg-[#FFF6E5]',
    pillText: 'text-[#B45309]',
    pillBorder: 'border-[#FDE68A]',
    pillLabelBn: 'বিস্তারিত দেখুন',
    pillLabelEn: 'View Details',
    focusBadgeBn: 'করযে হাসানা ও স্বাবলম্বিতা',
    focusBadgeEn: 'Qard Hasan & Welfare',
    Icon: HandHeart,
    PillIcon: Heart,
    href: '/programs',
  },
  {
    id: 'disaster-environment',
    serialNumberBn: '৪',
    serialNumberEn: '4',
    categoryBn: 'দুর্যোগ ব্যবস্থাপনা ও পরিবেশ সংরক্ষণ কার্যক্রম',
    categoryEn: 'Disaster Management & Green Environment',
    titleBn: 'আকস্মিক বিপদে দুর্গতদের ত্রাণ এবং বৃক্ষরোপণ কর্মসূচি',
    titleEn: 'Emergency Disaster Relief & Tree Plantation Campaign',
    descriptionBn: 'যেকোনো প্রাকৃতিক দুর্যোগ কিংবা আকস্মিক দুর্ঘটনায় ক্ষতিগ্রস্ত সাধারণ মানুষের পাশে দাঁড়িয়ে জরুরি মানবিক সহায়তা প্রদান করা হয়। এর পাশাপাশি পরিবেশের ভারসাম্য রক্ষা ও সমাজকে সুন্দর রাখতে বৃক্ষরোপণ কর্মসূচি সরাসরি বাস্তবায়ন করা হয়ে থাকে।',
    descriptionEn: 'Standing beside affected citizens during natural disasters or sudden accidents with emergency humanitarian aid. Directly implementing extensive tree plantation initiatives to preserve ecological balance and beautify communities.',
    keyPointsBn: [
      'প্রাকৃতিক দুর্যোগ ও আকস্মিক দুর্ঘটনায় দুর্গতদের মাঝে জরুরি ত্রাণ বিতরণ',
      'শীতবস্ত্র বিতরণ ও ক্ষতিগ্রস্ত গৃহহীন পরিবার পুনর্বাসন সহায়তা',
      'পরিবেশের ভারসাম্য রক্ষায় ফলজ ও বনজ বৃক্ষরোপণ কর্মসূচি বাস্তবায়ন',
      'পরিবেশ দূষণ রোধে সমাজ সচেতনতা ও সবুজায়ন ক্যাম্পেইন'
    ],
    keyPointsEn: [
      'Emergency relief distribution during natural disasters & accidents',
      'Winter clothing distribution and emergency rehabilitation',
      'Direct tree plantation campaigns to protect ecological balance',
      'Environmental cleanliness awareness & community greening'
    ],
    tagsBn: ['জরুরি মানবিক ত্রাণ', 'বৃক্ষরোপণ কর্মসূচি'],
    tagsEn: ['Disaster Relief', 'Tree Plantation'],
    image: cardEvents,
    iconBg: 'bg-[#059669]',
    accentColorHex: '#059669',
    curveBorderColor: 'border-[#A7F3D0]',
    pillBg: 'bg-[#ECFDF5]',
    pillText: 'text-[#047857]',
    pillBorder: 'border-[#A7F3D0]',
    pillLabelBn: 'বিস্তারিত দেখুন',
    pillLabelEn: 'View Details',
    focusBadgeBn: 'জরুরি ত্রাণ ও সবুজায়ন',
    focusBadgeEn: 'Relief & Greening',
    Icon: Trees,
    PillIcon: Sprout,
    href: '/programs',
  },
];

const ActivitiesOverview: React.FC = () => {
  const { language } = useLanguage();
  const { data: siteSettings } = useSiteSettings();
  const customCardImages = (siteSettings?.activities_images || {}) as Record<string, string>;

  // Modal State for reading full detailed discussion
  const [selectedActivity, setSelectedActivity] = useState<ActivityCard | null>(null);

  return (
    <section 
      id="activities-section"
      className="relative w-full overflow-hidden bg-gradient-to-b from-[#F4FAF5] via-[#F8FCF9] to-[#FFFFFF] py-16 sm:py-20 lg:py-24 border-b border-emerald-950/5"
    >
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
                {language === 'bn' ? 'সাংগঠনিক মূল রূপরেখা ও সেবামূলক স্তম্ভ' : 'Core Organizational Pillars & Initiatives'}
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
              <span className="text-[#14231B]">
                {language === 'bn' ? 'এক নজরে ' : 'At a Glance: '}
              </span>
              <span className="text-[#0B6B3A] relative inline-block">
                {language === 'bn' ? 'আমাদের কার্যক্রম' : 'Our Activities'}
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

          {/* Subtitle */}
          <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-[#6B7A72] max-w-2xl mx-auto leading-relaxed">
            {language === 'bn'
              ? 'সময়ের বাতিঘর-এর গঠনতন্ত্র ও মূল নীতিমালার আলোকে পরিচালিত মানবকল্যাণমূলক প্রধান ৪টি কার্যক্রম।'
              : 'The 4 primary humanitarian initiatives operated under the constitution and core principles of Somoyer Batighor.'}
          </p>
        </div>

        {/* 4 Cards Grid Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-7 items-stretch">
          {activitiesData.map((card) => {
            const cardImgSrc = customCardImages[card.id] || card.image;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedActivity(card)}
                className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.1)] border border-emerald-950/5 p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-2 group cursor-pointer"
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
                        src={cardImgSrc} 
                        alt={language === 'bn' ? card.titleBn : card.titleEn} 
                        className="w-full h-full object-cover rounded-bl-[38px]"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                {/* Main Body */}
                <div className="mb-5 z-10 flex-1 flex flex-col">
                  {/* Category Pill Tag */}
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
                      {language === 'bn' 
                        ? `${card.serialNumberBn}. ${card.categoryBn}` 
                        : `${card.serialNumberEn}. ${card.categoryEn}`}
                    </span>
                  </div>

                  {/* Main Title / শিরোনাম */}
                  <h3 className="text-lg sm:text-[18px] font-bold font-heading text-[#14231B] leading-snug mb-2.5 group-hover:text-primary transition-colors">
                    {language === 'bn' ? card.titleBn : card.titleEn}
                  </h3>

                  {/* Description / বিবরণ */}
                  <p className="text-xs sm:text-[13.5px] text-[#5A6860] leading-relaxed mb-4 flex-1">
                    {language === 'bn' ? card.descriptionBn : card.descriptionEn}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                    {(language === 'bn' ? card.tagsBn : card.tagsEn).map((tag, idx) => (
                      <span 
                        key={idx}
                        className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F4FAF5] text-[#2C4A3E] border border-emerald-950/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Row: Clean Pill on Left, Round Arrow on Right */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-emerald-950/5 z-10">
                  {/* Clean Pill Button that opens modal */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActivity(card);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-200 border hover:opacity-90 active:scale-95 whitespace-nowrap cursor-pointer",
                      card.pillBg,
                      card.pillText,
                      card.pillBorder
                    )}
                  >
                    <card.PillIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{language === 'bn' ? card.pillLabelBn : card.pillLabelEn}</span>
                  </button>

                  {/* Circular Arrow Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActivity(card);
                    }}
                    className={cn(
                      "w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center text-white shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md flex-shrink-0 cursor-pointer",
                      card.iconBg
                    )}
                    aria-label={`${language === 'bn' ? card.titleBn : card.titleEn} বিস্তারিত`}
                  >
                    <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </div>

                {/* Bottom-Left Corner Curved Accent Arc */}
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
            );
          })}
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

      {/* 6. Interactive Detailed Discussion Modal (বিস্তারিত আলোচনা ও রূপরেখা ডায়ালগ) */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full p-0 overflow-hidden rounded-[24px] border-emerald-950/10 shadow-2xl bg-white max-h-[90vh] flex flex-col">
          {selectedActivity && (
            <>
              {/* Modal Banner & Visual Header */}
              <div className="relative w-full h-44 sm:h-52 bg-slate-900 flex-shrink-0 overflow-hidden">
                <img 
                  src={customCardImages[selectedActivity.id] || selectedActivity.image} 
                  alt={language === 'bn' ? selectedActivity.titleBn : selectedActivity.titleEn} 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

                {/* Floating Icon Badge */}
                <div className="absolute bottom-4 left-5 sm:left-6 flex items-center gap-3 z-10">
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                    selectedActivity.iconBg
                  )}>
                    <selectedActivity.Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-1">
                      {language === 'bn' 
                        ? `${selectedActivity.serialNumberBn}. ${selectedActivity.categoryBn}` 
                        : `${selectedActivity.serialNumberEn}. ${selectedActivity.categoryEn}`}
                    </span>
                    <h4 className="text-white font-bold text-sm sm:text-base line-clamp-1 drop-shadow-sm">
                      {language === 'bn' ? selectedActivity.focusBadgeBn : selectedActivity.focusBadgeEn}
                    </h4>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-20"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
                <DialogHeader className="p-0 text-left space-y-1.5">
                  <DialogTitle className="text-xl sm:text-2xl font-extrabold font-heading text-[#14231B] leading-snug">
                    {language === 'bn' ? selectedActivity.titleBn : selectedActivity.titleEn}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#0B6B3A] font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {language === 'bn'
                        ? 'গঠনতন্ত্র ও বিধিমালা অনুযায়ী নির্ধারিত স্থায়ী সাংগঠনিক কর্মসূচি'
                        : 'Permanent organizational program per constitution & bylaws'}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                {/* Complete Detailed Paragraph */}
                <div className="bg-[#F8FCF9] border border-[#C8E6C9]/60 rounded-[18px] p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2 text-[#0B6B3A] font-bold text-sm">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>{language === 'bn' ? 'কার্যক্রমের বিবরণ ও লক্ষ্য' : 'Program Description & Objectives'}</span>
                  </div>
                  <p className="text-sm sm:text-[14.5px] text-[#2C4A3E] leading-relaxed">
                    {language === 'bn' ? selectedActivity.descriptionBn : selectedActivity.descriptionEn}
                  </p>
                </div>

                {/* Key Action Points */}
                <div>
                  <h5 className="text-sm font-bold text-[#14231B] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0B6B3A]" />
                    <span>{language === 'bn' ? 'এই কার্যক্রমের আওতাধীন প্রধান সেবাসমূহ:' : 'Key Services under this Program:'}</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(language === 'bn' ? selectedActivity.keyPointsBn : selectedActivity.keyPointsEn).map((point, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs hover:border-emerald-200 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#0B6B3A] flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-[13px] text-[#3D4D44] font-medium leading-relaxed">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={selectedActivity.href}
                    onClick={() => setSelectedActivity(null)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B6B3A] text-white hover:bg-[#09572F] text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-95"
                  >
                    <span>
                      {selectedActivity.id === 'health-aid'
                        ? (language === 'bn' ? 'জরুরি রক্তদাতা খুঁজুন' : 'Find Blood Donors')
                        : (language === 'bn' ? 'আমাদের কর্মসূচি পেজ দেখুন' : 'Explore Programs Page')}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => setSelectedActivity(null)}
                    className="rounded-full px-5 py-2 text-xs sm:text-sm border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ActivitiesOverview;
