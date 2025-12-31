import { Users, FolderOpen, Calendar, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const StatsSection = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data: dbStats } = useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
      const [members, events, committee] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('committee_members').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      
      return {
        members: members.count || 0,
        events: events.count || 0,
        committee: committee.count || 0,
      };
    },
  });

  const stats = [
    { icon: Users, value: dbStats?.members || 0, label: 'stats.members', suffix: '+' },
    { icon: FolderOpen, value: 25, label: 'stats.projects', suffix: '+' },
    { icon: Calendar, value: 10, label: 'stats.years', suffix: '+' },
    { icon: Award, value: dbStats?.events || 0, label: 'stats.events', suffix: '+' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110">
                <stat.icon className="w-7 h-7 md:w-9 md:h-9" />
              </div>
              <div className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
                <CountUp 
                  end={stat.value} 
                  isVisible={isVisible} 
                  suffix={stat.suffix}
                />
              </div>
              <p className="text-sm md:text-base text-muted-foreground font-medium">
                {t(stat.label)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Simple count-up animation component
const CountUp = ({ end, isVisible, suffix = '' }: { end: number; isVisible: boolean; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const duration = 2000;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end]);

  return <>{count}{suffix}</>;
};

export default StatsSection;
