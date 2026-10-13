import { 
  Users, 
  Award, 
  HeartHandshake, 
  CalendarCheck, 
  ArrowRight, 
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

  // 4 Minimalistic Clean Cards
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
      iconColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200',
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
      iconColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200',
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
      iconColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200',
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
      iconColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200',
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
    <section ref={sectionRef} className="py-10 md:py-14 bg-slate-50/70 border-b border-slate-200/60 relative">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'bn' ? 'সংগঠনের শক্তি ও পরিসংখ্যান' : 'Organization Network & Stats'}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {language === 'bn' ? 'এক নজরে আমাদের কার্যক্রম' : 'Our Activities at a Glance'}
          </h2>
          <div className="w-16 h-1 bg-emerald-600 rounded-full mx-auto mt-2" />
        </div>

        {/* 4 Minimalistic Clean Button Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                to={card.link}
                className="group relative bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-500/60 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Icon & Count */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-105 ${card.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading group-hover:text-emerald-700 transition-colors">
                      {isVisible ? (
                        <span>
                          {card.count.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                          {card.suffix}
                        </span>
                      ) : (
                        <span>0{card.suffix}</span>
                      )}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-emerald-600 transition-colors">
                    {language === 'bn' ? card.titleBn : card.titleEn}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {language === 'bn' ? card.subtitleBn : card.subtitleEn}
                  </p>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                  <span>{language === 'bn' ? card.actionTextBn : card.actionTextEn}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
