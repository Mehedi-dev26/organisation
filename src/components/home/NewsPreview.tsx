import { CalendarDays, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const NewsPreview = () => {
  const { t, language } = useLanguage();

  const { data: newsList, isLoading } = useQuery({
    queryKey: ['home-news-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : newsList?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'bn' ? 'কোন সংবাদ পাওয়া যায়নি' : 'No news found'}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
            {newsList?.map((item) => (
              <Card key={item.id} className="group overflow-hidden border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                {item.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={language === 'bn' ? item.title_bn : (item.title_en || item.title_bn)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                    <CalendarDays className="w-4 h-4" />
                    <span>{formatDate(item.published_at || item.created_at)}</span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {language === 'bn' ? item.title_bn : (item.title_en || item.title_bn)}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {language === 'bn' ? item.content_bn : (item.content_en || item.content_bn)}
                  </p>
                  <Button variant="link" className="p-0 h-auto text-primary group/btn">
                    {t('news.readMore')}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
