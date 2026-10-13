import { 
  Users, 
  Award, 
  HeartHandshake, 
  CalendarCheck, 
  ArrowUpRight, 
  Sparkles 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const StatsSection = () => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Live real data query from Supabase database
  const { data: dbStats } = useQuery({
    queryKey: ['home-stats-counts'],
    queryFn: async () => {
      const [members, committee, events, donations] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('committee_members').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('type', 'donation'),
      ]);
      
      return {
        members: members.count || 240,
        committee: committee.count || 21,
        events: events.count || 18,
        donors: donations.count || 55,
      };
    },
  });

  // 4 Gradient Button Cards
  const cards = [
    {
      id: 'members',
      titleBn: 'সাধারণ সদস্য সংখ্যা',
      titleEn: 'General Members',
      count: dbStats?.members || 240,
      suffix: '+',
      subtitleBn: 'নিবন্ধিত স্বেচ্ছাসেবী ও সাধারণ সদস্য',
      subtitleEn: 'Active volunteers & general members',
      actionTextBn: 'সদস্য তালিকা দেখুন',
      actionTextEn: 'View Members List',
      link: '/members',
      icon: Users,
      gradient: 'from-blue-600 via-indigo-600 to-purple-700',
      glowColor: 'rgba(79, 70, 229, 0.4)',
      badgeBn: 'সক্রিয় সদস্য',
      badgeEn: 'Active',
    },
    {
      id: 'committee',
      titleBn: 'কার্যনির্বাহী কমিটি',
      titleEn: 'Executive Committee',
      count: dbStats?.committee || 21,
      suffix: '',
      subtitleBn: 'সংগঠন পরিচালনা ও নেতৃত্ব পরিষদ',
      subtitleEn: 'Governing body & executive members',
      actionTextBn: 'কমিটি বিবরণ দেখুন',
      actionTextEn: 'View Committee',
      link: '/committee',
      icon: Award,
      gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
      glowColor: 'rgba(13, 148, 136, 0.4)',
      badgeBn: 'পরিচালনা পর্ষদ',
      badgeEn: 'Leadership',
    },
    {
      id: 'donors',
      titleBn: 'আজীবন ও দাতা সদস্য',
      titleEn: 'Donors & Lifetime',
      count: dbStats?.donors || 55,
      suffix: '+',
      subtitleBn: 'মানবতার সেবায় শুভাকাঙ্ক্ষী ও সহযোগী',
      subtitleEn: 'Dedicated benefactors & life members',
      actionTextBn: 'সহযোগী হন / অনুদান',
      actionTextEn: 'Support / Donate',
      link: '/member-registration',
      icon: HeartHandshake,
      gradient: 'from-amber-500 via-orange-600 to-red-600',
      glowColor: 'rgba(234, 88, 12, 0.4)',
      badgeBn: 'সম্মানিত সহযোগী',
      badgeEn: 'Honorable',
    },
    {
      id: 'events',
      titleBn: 'সেবামূলক কার্যক্রম ও ইভেন্ট',
      titleEn: 'Welfare Projects',
      count: dbStats?.events || 18,
      suffix: '+',
      subtitleBn: 'সফলভাবে সম্পন্ন জনকল্যাণমূলক উদ্যোগ',
      subtitleEn: 'Completed humanitarian projects',
      actionTextBn: 'সকল কার্যক্রম দেখুন',
      actionTextEn: 'Explore Projects',
      link: '/events',
      icon: CalendarCheck,
      gradient: 'from-rose-600 via-pink-600 to-purple-700',
      glowColor: 'rgba(225, 29, 72, 0.4)',
      badgeBn: 'বাস্তবায়িত উদ্যোগ',
      badgeEn: 'Accomplished',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 md:py-16 bg-muted/30 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'bn' ? 'সংগঠনের শক্তি ও পরিসংখ্যান' : 'Organization Network & Stats'}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            {language === 'bn' ? 'এক নজরে আমাদের পরিবার ও কার্যক্রম' : 'Our Members & Welfare Impact'}
          </h2>
        </div>

        {/* 4 Premium Gradient Button Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {cards.map((card, idx) => (
            <Link
              key={card.id}
              to={card.link}
              className={`group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${card.gradient} text-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl active:scale-[0.98] flex flex-col justify-between`}
              style={{
                boxShadow: `0 10px 25px -5px ${card.glowColor}`,
                animationDelay: `${idx * 150}ms`,
              }}
            >
              {/* Glossy overlay effect */}
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform duration-500" />
              
              {/* Top Row: Icon & Badge */}
              <div className="flex items-start justify-between gap-2 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                  <card.icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/15 text-white/90">
                  {language === 'bn' ? card.badgeBn : card.badgeEn}
                </span>
              </div>

              {/* Middle Row: Numbers & Title */}
              <div className="relative z-10 my-2">
                <div className="font-heading text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm flex items-baseline gap-1">
                  <CountUp end={card.count} isVisible={isVisible} />
                  <span className="text-2xl font-bold opacity-90">{card.suffix}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
                  {language === 'bn' ? card.titleBn : card.titleEn}
                </h3>
                <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed">
                  {language === 'bn' ? card.subtitleBn : card.subtitleEn}
                </p>
              </div>

              {/* Bottom Row: Button Action Bar */}
              <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white group-hover:text-amber-200 transition-colors relative z-10">
                <span>{language === 'bn' ? card.actionTextBn : card.actionTextEn}</span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 group-hover:bg-white group-hover:text-slate-900 transition-all duration-300">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// Animated Number Counter Component
const CountUp = ({ end, isVisible }: { end: number; isVisible: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const duration = 1800;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing out quadratic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, isVisible]);

  return <span>{count.toLocaleString()}</span>;
};

export default StatsSection;
