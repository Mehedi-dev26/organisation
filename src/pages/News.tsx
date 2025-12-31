import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const News = () => {
  const { t, language } = useLanguage();

  const news = [
    {
      id: 1,
      title: language === 'bn' ? 'বার্ষিক সাধারণ সভা ২০২৪ অনুষ্ঠিত' : 'Annual General Meeting 2024 Held',
      date: '2024-12-15',
      excerpt: language === 'bn' 
        ? 'গত ১৫ ডিসেম্বর সংগঠনের বার্ষিক সাধারণ সভা সফলভাবে অনুষ্ঠিত হয়েছে। সভায় গত বছরের কার্যক্রম পর্যালোচনা এবং আগামী বছরের পরিকল্পনা নিয়ে আলোচনা করা হয়।'
        : 'The annual general meeting of the organization was held successfully on December 15. The meeting reviewed last year\'s activities and discussed plans for the coming year.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    },
    {
      id: 2,
      title: language === 'bn' ? 'শীতবস্ত্র বিতরণ কর্মসূচি' : 'Winter Clothes Distribution Program',
      date: '2024-12-10',
      excerpt: language === 'bn'
        ? 'সুবিধাবঞ্চিত পরিবারগুলোর মধ্যে শীতবস্ত্র বিতরণ করা হয়েছে। এ কর্মসূচিতে প্রায় ৫০০ পরিবারকে শীতবস্ত্র প্রদান করা হয়।'
        : 'Winter clothes were distributed among underprivileged families. About 500 families were provided with winter clothes in this program.',
      image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=400&fit=crop',
    },
    {
      id: 3,
      title: language === 'bn' ? 'নতুন সদস্য নিবন্ধন চলছে' : 'New Member Registration Ongoing',
      date: '2024-12-01',
      excerpt: language === 'bn'
        ? 'সংগঠনে নতুন সদস্য নিবন্ধন কার্যক্রম চলমান রয়েছে। আগ্রহী ব্যক্তিরা যোগাযোগ করতে পারেন।'
        : 'New member registration is currently ongoing in the organization. Interested persons can contact us.',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop',
    },
    {
      id: 4,
      title: language === 'bn' ? 'বৃক্ষরোপণ কর্মসূচি সম্পন্ন' : 'Tree Plantation Program Completed',
      date: '2024-11-20',
      excerpt: language === 'bn'
        ? 'পরিবেশ সংরক্ষণের লক্ষ্যে বৃক্ষরোপণ কর্মসূচি সফলভাবে সম্পন্ন হয়েছে। এ কর্মসূচিতে ১০০০টি চারা রোপণ করা হয়েছে।'
        : 'The tree plantation program was completed successfully for environmental conservation. 1000 saplings were planted in this program.',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&fit=crop',
    },
    {
      id: 5,
      title: language === 'bn' ? 'বিনামূল্যে স্বাস্থ্য ক্যাম্প' : 'Free Health Camp',
      date: '2024-11-10',
      excerpt: language === 'bn'
        ? 'সুবিধাবঞ্চিত মানুষদের জন্য বিনামূল্যে স্বাস্থ্য ক্যাম্প আয়োজন করা হয়েছে। এ ক্যাম্পে প্রায় ৩০০ জন রোগীকে চিকিৎসা সেবা প্রদান করা হয়।'
        : 'A free health camp was organized for underprivileged people. About 300 patients were provided with medical services in this camp.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
    },
    {
      id: 6,
      title: language === 'bn' ? 'শিক্ষা উপকরণ বিতরণ' : 'Educational Material Distribution',
      date: '2024-10-25',
      excerpt: language === 'bn'
        ? 'দরিদ্র শিক্ষার্থীদের মধ্যে শিক্ষা উপকরণ বিতরণ করা হয়েছে। এ কর্মসূচিতে ২০০ শিক্ষার্থীকে বই, খাতা ও অন্যান্য উপকরণ প্রদান করা হয়।'
        : 'Educational materials were distributed among poor students. 200 students were provided with books, notebooks and other materials in this program.',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop',
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return language === 'bn'
      ? date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
      : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {t('news.title')}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              {language === 'bn' 
                ? 'আমাদের সকল কার্যক্রম এবং সংবাদের আপডেট দেখুন'
                : 'View updates on all our activities and news'}
            </p>
          </div>
        </section>

        {/* News List */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default News;
