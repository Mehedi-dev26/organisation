import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, Eye, Heart, Award, Users, Clock } from 'lucide-react';

const About = () => {
  const { t, language } = useLanguage();

  const values = [
    { icon: Heart, title: language === 'bn' ? 'সেবা' : 'Service', desc: language === 'bn' ? 'নিঃস্বার্থভাবে সমাজের সেবা করা' : 'Serving society selflessly' },
    { icon: Users, title: language === 'bn' ? 'ঐক্য' : 'Unity', desc: language === 'bn' ? 'একতাবদ্ধ হয়ে কাজ করা' : 'Working together in unity' },
    { icon: Award, title: language === 'bn' ? 'সততা' : 'Integrity', desc: language === 'bn' ? 'সৎ ও নৈতিক থাকা' : 'Staying honest and ethical' },
    { icon: Clock, title: language === 'bn' ? 'নিষ্ঠা' : 'Dedication', desc: language === 'bn' ? 'লক্ষ্যে অবিচল থাকা' : 'Staying committed to goals' },
  ];

  return (
    <MainLayout>
      {/* Hero */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {t('about.title')}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            {language === 'bn' 
              ? 'আমাদের সংগঠনের ইতিহাস, লক্ষ্য এবং মূল্যবোধ সম্পর্কে জানুন'
              : 'Learn about our organization\'s history, goals, and values'}
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">{t('about.mission')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {language === 'bn'
                  ? 'সমাজের সুবিধাবঞ্চিত মানুষদের পাশে দাঁড়ানো এবং তাদের জীবনমান উন্নয়নে কাজ করা। আমরা শিক্ষা, স্বাস্থ্য, এবং সামাজিক উন্নয়নের মাধ্যমে একটি সুন্দর সমাজ গঠনে প্রতিশ্রুতিবদ্ধ।'
                  : 'To stand by the underprivileged people of society and work to improve their quality of life. We are committed to building a beautiful society through education, health, and social development.'}
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-accent-foreground" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">{t('about.vision')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {language === 'bn'
                  ? 'একটি সুন্দর, সমতাপূর্ণ ও সমৃদ্ধ সমাজ গঠন যেখানে প্রতিটি মানুষ সম্মান ও মর্যাদার সাথে বাঁচতে পারবে। আমাদের স্বপ্ন একটি সুখী ও সমৃদ্ধ বাংলাদেশ।'
                  : 'To build a beautiful, equitable and prosperous society where every person can live with respect and dignity. Our dream is a happy and prosperous Bangladesh.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('about.values')}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="text-center p-6 rounded-xl bg-card border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
              {language === 'bn' ? 'আমাদের ইতিহাস' : 'Our History'}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {language === 'bn'
                ? 'সময়ের বাতিঘর ২০১৫ সালে প্রতিষ্ঠিত হয়। একদল সমাজসেবী মানুষের হাত ধরে শুরু হওয়া এই সংগঠন আজ হাজারো মানুষের পাশে দাঁড়িয়েছে। গত এক দশকে আমরা শিক্ষা, স্বাস্থ্য, এবং দারিদ্র্য বিমোচনে অসংখ্য প্রকল্প বাস্তবায়ন করেছি।'
                : 'Samoyer Batighor was established in 2015. This organization, which started with a group of social workers, has stood by thousands of people today. Over the past decade, we have implemented numerous projects in education, health, and poverty alleviation.'}
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default About;
