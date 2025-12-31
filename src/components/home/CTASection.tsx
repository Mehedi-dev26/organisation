import { ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

const CTASection = () => {
  const { t, language } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-primary/95 to-primary/90 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            {language === 'bn' ? 'আমাদের সাথে যোগ দিন' : 'Join Us Today'}
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed">
            {language === 'bn'
              ? 'একটি সুন্দর সমাজ গঠনে আপনার অংশগ্রহণ অপরিহার্য। আজই সদস্য হয়ে আমাদের পরিবারে যোগ দিন।'
              : 'Your participation is essential in building a beautiful society. Become a member today and join our family.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="group">
              <Users className="w-5 h-5 mr-2" />
              {t('hero.cta')}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <Link to="/contact">
                {t('nav.contact')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
