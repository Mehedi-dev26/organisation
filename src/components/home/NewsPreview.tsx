import { CalendarDays, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const NewsPreview = () => {
  const { t, language } = useLanguage();

  const news = [
    {
      id: 1,
      title: language === 'bn' ? 'বার্ষিক সাধারণ সভা ২০২৪ অনুষ্ঠিত' : 'Annual General Meeting 2024 Held',
      date: '2024-12-15',
      excerpt: language === 'bn' 
        ? 'গত ১৫ ডিসেম্বর সংগঠনের বার্ষিক সাধারণ সভা সফলভাবে অনুষ্ঠিত হয়েছে।'
        : 'The annual general meeting of the organization was held successfully on December 15.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop',
    },
    {
      id: 2,
      title: language === 'bn' ? 'শীতবস্ত্র বিতরণ কর্মসূচি' : 'Winter Clothes Distribution Program',
      date: '2024-12-10',
      excerpt: language === 'bn'
        ? 'সুবিধাবঞ্চিত পরিবারগুলোর মধ্যে শীতবস্ত্র বিতরণ করা হয়েছে।'
        : 'Winter clothes were distributed among underprivileged families.',
      image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=250&fit=crop',
    },
    {
      id: 3,
      title: language === 'bn' ? 'নতুন সদস্য নিবন্ধন চলছে' : 'New Member Registration Ongoing',
      date: '2024-12-01',
      excerpt: language === 'bn'
        ? 'সংগঠনে নতুন সদস্য নিবন্ধন কার্যক্রম চলমান রয়েছে।'
        : 'New member registration is currently ongoing in the organization.',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=250&fit=crop',
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return language === 'bn'
      ? date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
      : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t('news.title')}
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {t('news.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          {news.map((item) => (
            <Card key={item.id} className="group overflow-hidden border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300">
              <div className="aspect-video overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                  <CalendarDays className="w-4 h-4" />
                  <span>{formatDate(item.date)}</span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {item.excerpt}
                </p>
                <Button variant="link" className="p-0 h-auto text-primary group/btn">
                  {t('news.readMore')}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="default" size="lg" asChild>
            <Link to="/news">
              {language === 'bn' ? 'সব সংবাদ দেখুন' : 'View All News'}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NewsPreview;
