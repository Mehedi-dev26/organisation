import { useState } from 'react';
import { UserPlus, Heart, Phone, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

const CTASection = () => {
  const { language } = useLanguage();
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  // Fetch dynamic CTA settings from Supabase
  const { data: ctaSettings } = useQuery({
    queryKey: ['cta-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'cta_section')
        .maybeSingle();

      if (error || !data) return null;
      return data.value as any;
    },
  });

  const title = ctaSettings?.title_bn || 'আসুন, আমরা সবাই মিলে একটি মানবিক ও সুন্দর সমাজ গড়ে তুলি';
  const titleEn = ctaSettings?.title_en || 'Let us unite to build a humanitarian and compassionate society';
  const bgImage = ctaSettings?.image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80';

  return (
    <section 
      className="relative py-14 sm:py-20 md:py-24 text-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(0, 106, 78, 0.90) 0%, rgba(0, 77, 52, 0.94) 100%), url(${bgImage}) center/cover no-repeat`,
        backgroundAttachment: 'scroll',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
        {/* Title matching Helpline Naogaon cta-banner-title */}
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-white leading-snug sm:leading-tight mb-8 drop-shadow-md tracking-tight max-w-4xl mx-auto">
          {language === 'bn' ? title : titleEn}
        </h2>

        {/* Yellow Button matching reference .btn-hn-yellow */}
        <div className="flex justify-center items-center">
          <button
            type="button"
            onClick={() => setIsVolunteerModalOpen(true)}
            className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#ffc107] hover:bg-[#e0a800] text-gray-950 font-extrabold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 border-0"
            style={{
              boxShadow: '0 8px 24px rgba(255, 193, 7, 0.45)',
            }}
          >
            <UserPlus className="w-5 h-5 text-gray-900" />
            <span>{language === 'bn' ? 'স্বেচ্ছাসেবক হন' : 'Become a Volunteer'}</span>
          </button>
        </div>
      </div>

      {/* Volunteer Registration Modal */}
      <Dialog open={isVolunteerModalOpen} onOpenChange={setIsVolunteerModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold w-fit mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'স্বেচ্ছাসেবক প্ল্যাটফর্ম' : 'Volunteer Platform'}</span>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {language === 'bn' ? 'স্বেচ্ছাসেবক হিসেবে যুক্ত হন' : 'Join as a Volunteer'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 leading-relaxed">
              {language === 'bn'
                ? 'মানবিক কাজ ও সমাজের সুবিধাবঞ্চিত মানুষের পাশে দাঁড়াতে আমাদের স্বেচ্ছাসেবক টিমে স্বাগতম।'
                : 'Welcome to our volunteer community dedicated to social welfare and humanitarian service.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-3">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-sm text-gray-800 space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                <span>{language === 'bn' ? 'কীভাবে স্বেচ্ছাসেবক হবেন?' : 'How to Join?'}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'bn'
                  ? 'আপনি সরাসরি আমাদের সাধারণ সদস্য অথবা স্বেচ্ছাসেবক নিবন্ধন ফরম পূরণ করে যুক্ত হতে পারেন।'
                  : 'You can register online directly through our member & volunteer portal.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all text-center inline-flex items-center justify-center gap-2"
                asChild
              >
                <Link to="/member-registration" onClick={() => setIsVolunteerModalOpen(false)}>
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'bn' ? 'অনলাইন নিবন্ধন ফরম পূরণ করুন' : 'Fill Online Registration Form'}</span>
                </Link>
              </button>

              <a
                href="tel:01916314315"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-gray-800 font-bold text-xs transition-all text-center inline-flex items-center justify-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'bn' ? 'জরুরি হেল্পলাইনে কথা বলুন (01916314315)' : 'Call Helpline'}</span>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CTASection;
