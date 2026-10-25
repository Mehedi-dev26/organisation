import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Droplet, 
  Search, 
  MapPin, 
  PhoneCall, 
  HeartHandshake, 
  UserCheck, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDonationEligibility, formatBengaliDate } from '@/lib/bloodUtils';

interface BloodDonor {
  id: string;
  full_name: string;
  phone: string;
  blood_group: string;
  division: string | null;
  district: string | null;
  upazila: string | null;
  last_donated: string | null;
  status: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const BloodDonationPreview: React.FC = () => {
  const { language } = useLanguage();
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Fetch approved blood donors directly from Supabase
  const { data: donors = [], isLoading } = useQuery<BloodDonor[]>({
    queryKey: ['home-blood-donors-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blood_donors')
        .select('id, full_name, phone, blood_group, division, district, upazila, last_donated, status')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching blood donors:', error);
        return [];
      }
      return (data || []) as BloodDonor[];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });

  // Calculate count per blood group
  const groupCounts = BLOOD_GROUPS.reduce((acc, group) => {
    acc[group] = donors.filter((d) => d.blood_group === group).length;
    return acc;
  }, {} as Record<string, number>);

  // Filtered donors for quick preview
  const displayDonors = selectedGroup 
    ? donors.filter((d) => d.blood_group === selectedGroup).slice(0, 4)
    : donors.slice(0, 4);

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-rose-50/25 to-white overflow-hidden border-t border-rose-100/40">
      {/* Decorative background aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* Signature Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          {/* Top Pill Badge */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] shadow-xs">
              <span className="w-5 h-5 rounded-full bg-[#0B6B3A] flex items-center justify-center text-white flex-shrink-0">
                <Droplet className="w-3.5 h-3.5 fill-current" />
              </span>
              <span className="text-[#0B6B3A] text-xs sm:text-sm font-semibold tracking-wide">
                {language === 'bn' ? 'জরুরি রক্তদান কর্মসূচি ও রক্তদাতা নেটওয়ার্ক' : 'Emergency Blood Donation & Donor Network'}
              </span>
            </div>
          </div>

          {/* Main Heading with Organic Leaf Strokes & Hand-Painted Underline */}
          <div className="inline-flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap mb-4">
            {/* Left Leaf Sparkle */}
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
                {language === 'bn' ? 'জরুরি প্রয়োজনে ' : 'Emergency '}
              </span>
              <span className="text-[#0B6B3A] relative inline-block">
                {language === 'bn' ? 'রক্তদাতা খুঁজুন' : 'Blood Donors'}
                {/* Yellow-Green Hand-Painted Underline */}
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

            {/* Right Leaf Sparkle */}
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

          <p className="text-sm sm:text-base text-[#6B7A72] max-w-2xl mx-auto leading-relaxed">
            {language === 'bn'
              ? 'মুহূর্তের প্রয়োজনে একটি ব্যাগ রক্ত বাঁচাতে পারে একটি মূল্যবান জীবন। সময়ের বাতিঘরের ডাটাবেস থেকে সহজেই আপনার প্রয়োজনীয় গ্রুপের রক্তদাতা খুঁজে নিন।'
              : 'In critical times, a single bag of blood can save a precious human life. Connect with verified voluntary blood donors across Naogaon and Bangladesh.'}
          </p>
        </div>

        {/* Live Blood Group Quick Filter Bar */}
        <div className="mb-10 sm:mb-12">
          <div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === 'bn' ? 'রক্তের গ্রুপ অনুযায়ী রক্তদাতা সংখ্যা' : 'Donors by Blood Group'}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedGroup('')}
              className={cn(
                "px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border shadow-2xs flex items-center gap-1.5",
                selectedGroup === ''
                  ? "bg-[#0B6B3A] text-white border-[#0B6B3A] shadow-md scale-105"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
              )}
            >
              <span>{language === 'bn' ? 'সকল' : 'All'}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[11px]",
                selectedGroup === '' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {donors.length}
              </span>
            </button>

            {BLOOD_GROUPS.map((group) => {
              const count = groupCounts[group] || 0;
              const isSelected = selectedGroup === group;
              return (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(isSelected ? '' : group)}
                  className={cn(
                    "px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border shadow-2xs flex items-center gap-1.5",
                    isSelected
                      ? "bg-rose-600 text-white border-rose-600 shadow-md scale-105"
                      : "bg-white text-slate-700 hover:bg-rose-50/50 border-slate-200 hover:border-rose-300"
                  )}
                >
                  <Droplet className={cn("w-3.5 h-3.5", isSelected ? "text-white fill-current" : "text-rose-500 fill-current")} />
                  <span>{group}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[11px] font-semibold",
                    isSelected ? "bg-white/20 text-white" : "bg-rose-100/70 text-rose-700"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Donors Cards Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
          </div>
        ) : displayDonors.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[24px] border border-slate-100 p-8 shadow-xs max-w-lg mx-auto">
            <Droplet className="w-12 h-12 text-rose-300 mx-auto mb-3" />
            <h4 className="font-heading font-bold text-slate-800 text-lg mb-1">
              {language === 'bn' ? 'এই গ্রুপের রক্তদাতা পাওয়া যায়নি' : 'No donors found in this group'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              {language === 'bn' ? 'অন্য গ্রুপ নির্বাচন করুন অথবা সকল রক্তদাতা দেখুন' : 'Try selecting another blood group or view all donors.'}
            </p>
            <Button variant="outline" size="sm" onClick={() => setSelectedGroup('')}>
              {language === 'bn' ? 'সকল গ্রুপ দেখুন' : 'View All Groups'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-12">
            {displayDonors.map((donor) => {
              const eligibility = getDonationEligibility(donor.last_donated);
              return (
                <div
                  key={donor.id}
                  className="bg-white rounded-[24px] p-5 sm:p-6 border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between relative group"
                >
                  <div>
                    {/* Top Row: Blood Group Badge & Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                        {donor.blood_group}
                      </div>

                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
                        eligibility.isEligible
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", eligibility.isEligible ? "bg-emerald-500" : "bg-amber-500")} />
                        {language === 'bn' ? eligibility.statusTextBn : eligibility.statusTextEn}
                      </span>
                    </div>

                    {/* Donor Name & Location */}
                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#14231B] mb-1.5 line-clamp-1 group-hover:text-[#0B6B3A] transition-colors">
                      {donor.full_name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {donor.upazila ? `${donor.upazila}, ` : ''}{donor.district || 'নওগাঁ'}
                      </span>
                    </div>

                    {/* Last donation date if available */}
                    {donor.last_donated && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-4">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{language === 'bn' ? 'সর্বশেষ রক্তদান: ' : 'Last donation: '}{formatBengaliDate(donor.last_donated)}</span>
                      </div>
                    )}
                  </div>

                  {/* Call Action Button */}
                  <a
                    href={`tel:${donor.phone}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-[#0B6B3A] text-[#0B6B3A] hover:text-white font-bold text-xs sm:text-sm border border-emerald-200 transition-all duration-200 shadow-2xs mt-2"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{donor.phone}</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center">
          <Button 
            size="lg"
            className="w-full sm:w-auto h-12 px-7 bg-[#0B6B3A] hover:bg-[#08522c] text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 inline-flex items-center gap-2"
            asChild
          >
            <Link to="/blood-donors">
              <Search className="w-4 h-4" />
              <span>{language === 'bn' ? 'সকল রক্তদাতা ডিরেক্টরি দেখুন' : 'Explore All Blood Donors'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <Button 
            size="lg"
            variant="outline"
            className="w-full sm:w-auto h-12 px-7 border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-full transition-all hover:scale-105 inline-flex items-center gap-2"
            asChild
          >
            <Link to="/blood-donors">
              <HeartHandshake className="w-4 h-4 text-rose-600" />
              <span>{language === 'bn' ? 'রক্তদাতা হিসেবে নিবন্ধন করুন' : 'Register as Blood Donor'}</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BloodDonationPreview;
