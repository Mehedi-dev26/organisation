import { Megaphone, PhoneCall, HeartHandshake } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

const NoticeMarquee = () => {
  const { language } = useLanguage();

  const notices = [
    language === 'bn'
      ? 'জরুরি রক্তদান ও মুমূর্ষু রোগীদের জরুরি সহায়তায় আমাদের হেল্পলাইন ২৪ ঘণ্টা খোলা রয়েছে।'
      : 'Emergency blood donation & medical patient support helpline is open 24/7.',
    language === 'bn'
      ? 'সময়ের বাতিঘর-এর অনলাইন সদস্য নিবন্ধন ও মাসিক চাঁদা প্রদান কার্যক্রম চলমান রয়েছে।'
      : 'Online member registration and monthly dues payment system is live.',
    language === 'bn'
      ? 'অসহায় ও দরিদ্র মানুষের পাশে দাঁড়াতে আপনার সাহায্য বা অনুদান পৌঁছে দিন আমাদের তহবিলে।'
      : 'Support our humanitarian initiatives with your valuable donation.',
  ];

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white shadow-inner border-y border-amber-600/30 overflow-hidden">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Notice Badge */}
        <div className="flex-shrink-0 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-md font-bold text-white shadow-sm border border-white/20">
          <Megaphone className="w-4 h-4 text-amber-200 animate-bounce" />
          <span className="whitespace-nowrap">
            {language === 'bn' ? 'জরুরি নোটিশ / হেল্পলাইন' : 'Helpline & Notice'}
          </span>
        </div>

        {/* Marquee Scrolling Text */}
        <div className="flex-1 overflow-hidden relative h-6 flex items-center">
          <div className="animate-marquee whitespace-nowrap inline-flex items-center gap-8 font-medium">
            {notices.map((notice, idx) => (
              <span key={idx} className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{notice}</span>
              </span>
            ))}
            {/* Duplicate for infinite loop illusion */}
            {notices.map((notice, idx) => (
              <span key={`dup-${idx}`} className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{notice}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Quick Call & Blood Donor Action */}
        <div className="flex-shrink-0 hidden sm:flex items-center gap-2">
          <Link
            to="/blood-donors"
            className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-1 rounded-md shadow-sm transition-all text-xs"
          >
            <span>{language === 'bn' ? 'রক্তদাতা তালিকা' : 'Blood Donors'}</span>
          </Link>
          <a
            href="tel:01916314315"
            className="inline-flex items-center gap-1 bg-white text-amber-800 hover:bg-amber-50 font-bold px-3 py-1 rounded-md shadow-sm transition-all text-xs"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
          </a>
          <Link
            to="/member-dashboard/pay-dues"
            className="inline-flex items-center gap-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3 py-1 rounded-md shadow-sm transition-all text-xs"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-300" />
            <span>{language === 'bn' ? 'অনুদান' : 'Donate'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NoticeMarquee;
