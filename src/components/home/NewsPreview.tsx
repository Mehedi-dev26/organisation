import { Calendar, ArrowRight, Loader2, Newspaper } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Default news items if database is empty, inspired by Helpline / humanitarian activities
const defaultNews = [
  {
    id: 'default-news-1',
    title_bn: 'আনুষ্ঠানিকভাবে যাত্রা শুরু করল স্বেচ্ছাসেবী সংগঠন “সময়ের বাতিঘর”-এর অফিসিয়াল ওয়েবসাইট!',
    title_en: 'Official launch of "Samoyer Batighor" voluntary organization website!',
    content_bn: 'আলহামদুলিল্লাহ! সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানোর নতুন অঙ্গীকার নিয়ে আমাদের আধুনিক ডিজিটাল প্ল্যাটফর্মের যাত্রা শুরু হলো।',
    content_en: 'Alhamdulillah! Our modern digital platform starts its journey with a renewed commitment to serve underprivileged communities.',
    image_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80',
    published_at: new Date().toISOString(),
  },
  {
    id: 'default-news-2',
    title_bn: '“নওগাঁ থেকে দেশব্যাপী মানবিক সহায়তা”— জরুরি খাদ্য ও ওষুধ বিতরণ সম্পন্ন',
    title_en: '"From Naogaon to Nationwide"— Emergency Food & Medicine Distribution',
    content_bn: 'অসহায় পরিবারের মাঝে খাদ্য সামগ্রী ও জরুরি প্রয়োজনীয় চিকিৎসা সহায়তা পৌঁছে দেওয়ার বিশেষ উদ্যোগ সম্পন্ন হয়েছে।',
    content_en: 'Special initiative completed to deliver food supplies and emergency medical assistance to vulnerable families.',
    image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'default-news-3',
    title_bn: 'প্রয়োজনীয় বই নেই? পাশে আছে সময়ের বাতিঘর শিক্ষা সহায়তা প্রকল্প',
    title_en: 'In need of educational books? Batighor Education Support stands beside you',
    content_bn: 'বই হোক সবার অধিকার—অর্থের অভাবে কোনো মেধাবী শিক্ষার্থীর পড়াশোনা বন্ধ হতে দেব না আমরা।',
    content_en: 'Education is everyone\'s right—we will ensure no talented student drops out due to financial constraints.',
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const NewsPreview = () => {
  const { language } = useLanguage();

  const { data: dbNews, isLoading } = useQuery({
    queryKey: ['home-news-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) {
        console.warn('Error fetching news:', error);
        return [];
      }
      return data || [];
    },
  });

  const newsList = dbNews && dbNews.length > 0 ? dbNews : defaultNews;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return language === 'bn'
      ? date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })
      : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <section className="py-16 md:py-24 bg-slate-50/60 border-t border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Centered Heading in Front Page Style */}
        <div className="text-center mb-12 md:mb-14">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs sm:text-sm font-semibold mb-3 border border-emerald-200">
            <Newspaper className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'bn' ? 'সর্বশেষ আপডেট ও কার্যক্রম' : 'Latest Updates'}</span>
          </div>

          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            {language === 'bn' ? 'সাম্প্রতিক সংবাদ' : 'Recent News'}
          </h2>

          <p className="text-gray-600 text-sm md:text-base mt-2 max-w-2xl mx-auto">
            {language === 'bn' 
              ? 'আমাদের সংগঠনের মাঠপর্যায়ের মানবিক কার্যক্রম, উদ্যোগ ও গুরুত্বপূর্ণ সাম্প্রতিক সংবাদ' 
              : 'Latest field activities, humanitarian initiatives, and news from our organization'}
          </p>

          {/* Section Divider (Line - Dot - Line) */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-12 h-0.5 bg-emerald-600/40 rounded-full" />
            <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse" />
            <div className="w-12 h-0.5 bg-emerald-600/40 rounded-full" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-12">
            {newsList.map((item) => {
              const title = language === 'bn' ? item.title_bn : (item.title_en || item.title_bn);
              const content = language === 'bn' ? item.content_bn : (item.content_en || item.content_bn);
              const dateText = formatDate(item.published_at || (item as any).created_at);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-emerald-600/60 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    {/* Horizontal top card layout matching helpline news-item-card */}
                    <div className="flex gap-3.5 items-start">
                      {item.image_url && (
                        <div className="w-28 h-24 sm:w-32 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
                          <img
                            src={item.image_url}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={item.id.startsWith('default-') ? '/news' : `/news/${item.id}`}
                          className="font-heading font-bold text-gray-900 group-hover:text-emerald-700 text-sm sm:text-base leading-snug line-clamp-2 block transition-colors mb-1.5"
                        >
                          {title}
                        </Link>
                        
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{dateText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mt-3 leading-relaxed">
                      {content}
                    </p>
                  </div>

                  {/* Read More button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={item.id.startsWith('default-') ? '/news' : `/news/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      <span>{language === 'bn' ? 'বিস্তারিত পড়ুন' : 'Read More'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {language === 'bn' ? 'সংবাদ' : 'News'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-full px-7 py-2.5 font-bold shadow-sm transition-all duration-300"
          >
            <Link to="/news" className="inline-flex items-center gap-2">
              <span>{language === 'bn' ? 'সকল সংবাদ দেখুন' : 'View All News'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NewsPreview;
