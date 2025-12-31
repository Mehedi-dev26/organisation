import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail } from 'lucide-react';

const Committee = () => {
  const { t, language } = useLanguage();

  const committee = [
    { name: language === 'bn' ? 'আব্দুল করিম' : 'Abdul Karim', role: 'committee.president', phone: '01XXX-XXXXXX' },
    { name: language === 'bn' ? 'রহিম উদ্দিন' : 'Rahim Uddin', role: 'committee.vicePresident', phone: '01XXX-XXXXXX' },
    { name: language === 'bn' ? 'মোহাম্মদ হাসান' : 'Mohammad Hasan', role: 'committee.secretary', phone: '01XXX-XXXXXX' },
    { name: language === 'bn' ? 'ফাতেমা খাতুন' : 'Fatema Khatun', role: 'committee.treasurer', phone: '01XXX-XXXXXX' },
    { name: language === 'bn' ? 'করিম মিয়া' : 'Karim Mia', role: 'committee.member', phone: '01XXX-XXXXXX' },
    { name: language === 'bn' ? 'আয়েশা বেগম' : 'Ayesha Begum', role: 'committee.member', phone: '01XXX-XXXXXX' },
    { name: language === 'bn' ? 'সাইফুল ইসলাম' : 'Saiful Islam', role: 'committee.member', phone: '01XXX-XXXXXX' },
    { name: language === 'bn' ? 'জাহানারা খাতুন' : 'Jahanara Khatun', role: 'committee.member', phone: '01XXX-XXXXXX' },
  ];

  const president = committee[0];
  const vicePresident = committee[1];
  const secretary = committee[2];
  const treasurer = committee[3];
  const members = committee.slice(4);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
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
            {/* President */}
            <div className="max-w-md mx-auto mb-12">
              <CommitteeMemberCard member={president} t={t} isLarge />
            </div>

            {/* Vice President, Secretary, Treasurer */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <CommitteeMemberCard member={vicePresident} t={t} />
              <CommitteeMemberCard member={secretary} t={t} />
              <CommitteeMemberCard member={treasurer} t={t} />
            </div>

            {/* Executive Members */}
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {language === 'bn' ? 'কার্যনির্বাহী সদস্যবৃন্দ' : 'Executive Members'}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {members.map((member, index) => (
                <CommitteeMemberCard key={index} member={member} t={t} isSmall />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

interface CommitteeMemberCardProps {
  member: { name: string; role: string; phone: string };
  t: (key: string) => string;
  isLarge?: boolean;
  isSmall?: boolean;
}

const CommitteeMemberCard = ({ member, t, isLarge, isSmall }: CommitteeMemberCardProps) => {
  const imageSize = isLarge ? 'w-32 h-32 md:w-40 md:h-40' : isSmall ? 'w-20 h-20' : 'w-24 h-24 md:w-28 md:h-28';
  
  return (
    <div className="text-center group">
      <div className="relative mb-4 inline-block">
        <div className={`${imageSize} rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary transition-colors duration-300 mx-auto`}>
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
            alt={member.name}
            className="w-full h-full object-cover bg-muted"
          />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium whitespace-nowrap">
          {t(member.role)}
        </div>
      </div>
      <h3 className={`font-heading font-semibold text-foreground ${isLarge ? 'text-xl md:text-2xl' : isSmall ? 'text-sm' : 'text-lg'}`}>
        {member.name}
      </h3>
      {!isSmall && (
        <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground text-sm">
          <Phone className="w-4 h-4" />
          <span>{member.phone}</span>
        </div>
      )}
    </div>
  );
};

export default Committee;
