import { Target, Eye, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutPreview = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Target,
      title: 'about.mission',
      description: 'about.missionText',
    },
    {
      icon: Eye,
      title: 'about.vision',
      description: 'about.visionText',
    },
    {
      icon: Heart,
      title: 'about.values',
      description: 'about.valuesText',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t('about.title')}
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t('about.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                {t(feature.title)}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t(feature.description)}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="default" size="lg" asChild>
            <Link to="/about">
              {t('hero.learn')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AboutPreview;
