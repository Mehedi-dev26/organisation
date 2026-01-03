import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Loader2 } from 'lucide-react';
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

  const { data: committeeMembers, isLoading } = useQuery({
    queryKey: ['public-committee'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as CommitteeMember[];
    },
  });

  // Group members by position type
  const president = committeeMembers?.find(m => 
    m.position_bn.includes('সভাপতি') && !m.position_bn.includes('সহ')
  );
  const vicePresident = committeeMembers?.find(m => 
    m.position_bn.includes('সহ-সভাপতি') || m.position_bn.includes('সহসভাপতি')
  );
  const secretary = committeeMembers?.find(m => 
    m.position_bn.includes('সাধারণ সম্পাদক') || m.position_bn.includes('সচিব')
  );
  const treasurer = committeeMembers?.find(m => 
    m.position_bn.includes('কোষাধ্যক্ষ')
  );
  
  const executiveMembers = committeeMembers?.filter(m => 
    m !== president && m !== vicePresident && m !== secretary && m !== treasurer
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {t('committee.title')}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            {language === 'bn' 
              ? 'আমাদের নির্বাহী কমিটির সদস্যদের সাথে পরিচিত হন'
              : 'Meet our executive committee members'}
          </p>
        </div>
      </section>

      {/* Committee */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          {committeeMembers?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {language === 'bn' ? 'কোন কমিটি সদস্য পাওয়া যায়নি' : 'No committee members found'}
            </div>
          ) : (
            <>
              {/* President */}
              {president && (
                <div className="max-w-md mx-auto mb-12">
                  <CommitteeMemberCard member={president} language={language} isLarge />
                </div>
              )}

              {/* Vice President, Secretary, Treasurer */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                {vicePresident && <CommitteeMemberCard member={vicePresident} language={language} />}
                {secretary && <CommitteeMemberCard member={secretary} language={language} />}
                {treasurer && <CommitteeMemberCard member={treasurer} language={language} />}
              </div>

              {/* Executive Members */}
              {executiveMembers && executiveMembers.length > 0 && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="font-heading text-2xl font-bold text-foreground">
                      {language === 'bn' ? 'কার্যনির্বাহী সদস্যবৃন্দ' : 'Executive Members'}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                    {executiveMembers.map((member) => (
                      <CommitteeMemberCard key={member.id} member={member} language={language} isSmall />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

interface CommitteeMemberCardProps {
  member: CommitteeMember;
  language: string;
  isLarge?: boolean;
  isSmall?: boolean;
}

const CommitteeMemberCard = ({ member, language, isLarge, isSmall }: CommitteeMemberCardProps) => {
  const imageSize = isLarge ? 'w-32 h-32 md:w-40 md:h-40' : isSmall ? 'w-20 h-20' : 'w-24 h-24 md:w-28 md:h-28';
  const name = language === 'bn' ? member.name_bn : (member.name_en || member.name_bn);
  const position = language === 'bn' ? member.position_bn : (member.position_en || member.position_bn);
  
  return (
    <div className="text-center group">
      <div className="relative mb-4 inline-block">
        <div className={`${imageSize} rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary transition-colors duration-300 mx-auto`}>
          <img
            src={member.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name_bn}`}
            alt={name}
            className="w-full h-full object-cover bg-muted"
          />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium whitespace-nowrap">
          {position}
        </div>
      </div>
      <h3 className={`font-heading font-semibold text-foreground ${isLarge ? 'text-xl md:text-2xl' : isSmall ? 'text-sm' : 'text-lg'}`}>
        {name}
      </h3>
      {!isSmall && member.phone && (
        <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground text-sm">
          <Phone className="w-4 h-4" />
          <span>{member.phone}</span>
        </div>
      )}
    </div>
  );
};

export default Committee;
