import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CommitteePreview = () => {
  const { t, language } = useLanguage();

  const { data: committeeMembers, isLoading } = useQuery({
    queryKey: ['home-committee-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(3);
      
      if (error) {
        console.warn('Error fetching committee preview:', error);
        return [];
      }
      return data || [];
    },
  });

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
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
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : committeeMembers?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'bn' ? 'কোন কমিটি সদস্য পাওয়া যায়নি' : 'No committee members found'}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto mb-12">
            {committeeMembers?.map((member) => {
              const fallbackImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name_bn}`;
              const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = fallbackImage;
              };
              return (
                <div
                  key={member.id}
                  className="group text-center"
                >
                  <div className="relative mb-6 inline-block">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary transition-colors duration-300 mx-auto">
                      <img
                        src={member.photo_url || fallbackImage}
                        alt={language === 'bn' ? member.name_bn : (member.name_en || member.name_bn)}
                        className="w-full h-full object-cover bg-muted"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium whitespace-nowrap">
                      {language === 'bn' ? member.position_bn : (member.position_en || member.position_bn)}
                    </div>
                  </div>
                  <h3 className="font-heading text-lg md:text-xl font-semibold text-foreground">
                    {language === 'bn' ? member.name_bn : (member.name_en || member.name_bn)}
                  </h3>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/committee">
              {language === 'bn' ? 'সম্পূর্ণ কমিটি দেখুন' : 'View Full Committee'}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CommitteePreview;
