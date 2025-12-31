import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CommitteePreview = () => {
  const { t, language } = useLanguage();

  const committee = [
    {
      name: language === 'bn' ? 'আব্দুল করিম' : 'Abdul Karim',
      role: 'committee.president',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abdul',
    },
    {
      name: language === 'bn' ? 'মোহাম্মদ হাসান' : 'Mohammad Hasan',
      role: 'committee.secretary',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hasan',
    },
    {
      name: language === 'bn' ? 'ফাতেমা খাতুন' : 'Fatema Khatun',
      role: 'committee.treasurer',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatema',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t('committee.title')}
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {t('committee.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto mb-12">
          {committee.map((member, index) => (
            <div
              key={member.name}
              className="group text-center"
            >
              <div className="relative mb-6 inline-block">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary transition-colors duration-300 mx-auto">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover bg-muted"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium whitespace-nowrap">
                  {t(member.role)}
                </div>
              </div>
              <h3 className="font-heading text-lg md:text-xl font-semibold text-foreground">
                {member.name}
              </h3>
            </div>
          ))}
        </div>

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
