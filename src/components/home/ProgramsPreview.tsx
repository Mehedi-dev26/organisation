import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ArrowRight, 
  Sparkles, 
  Phone, 
  Copy, 
  Check, 
  Megaphone, 
  Layers, 
  LayoutGrid, 
  Calendar,
  X,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

export interface ProgramItem {
  id: string | number;
  title_bn: string;
  title_en: string;
  description_bn: string;
  description_en: string;
  status: 'ongoing' | 'completed';
  status_bn: string;
  image_url: string;
  target_amount?: number;
  raised_amount?: number;
  date?: string;
  category_bn?: string;
}

export const defaultPrograms: ProgramItem[] = [
  {
    id: 1,
    title_bn: 'অসহায় মানুষের চিকিৎসায় পাশে আমরা',
    title_en: 'Beside Underprivileged Patients in Medical Treatment',
    description_bn: 'অসহায় রোগীর জরুরি চিকিৎসা সহায়তা ও জীবন রক্ষাকারী ওষুধ প্রদানে পাশে থাকার মানবিক উদ্যোগ।',
    description_en: 'Humanitarian initiative providing emergency medical aid and life-saving medicines to destitute patients.',
    status: 'ongoing',
    status_bn: 'চলমান',
    image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    target_amount: 40000,
    raised_amount: 12500,
    category_bn: 'চিকিৎসা সহায়তা',
  },
  {
    id: 2,
    title_bn: 'মাসিক শিক্ষা উপবৃত্তি কর্মসূচি',
    title_en: 'Monthly Educational Scholarship Program',
    description_bn: 'মেধাবী ও অসচ্ছল শিক্ষার্থীদের শিক্ষা জীবন নিরবচ্ছিন্ন রাখতে প্রতি মাসে নিয়মিত শিক্ষা উপবৃত্তি প্রদান।',
    description_en: 'Monthly scholarship support to ensure uninterrupted education for meritorious students in need.',
    status: 'ongoing',
    status_bn: 'চলমান',
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    target_amount: 72000,
    raised_amount: 34000,
    category_bn: 'শিক্ষা কর্মসূচি',
  },
  {
    id: 3,
    title_bn: 'জরুরি দুর্যোগ সহায়তা ও ত্রাণ বিতরণ',
    title_en: 'Emergency Disaster Relief & Aid Distribution',
    description_bn: 'বন্যা, শীতবস্ত্র সংকট কিংবা যেকোনো প্রাকৃতিক দুর্যোগে দুর্গত মানুষের ঘরে খাদ্য ও প্রয়োজনীয় সামগ্রী পৌঁছে দেওয়া।',
    description_en: 'Delivering urgent food supplies and essential relief to people affected by natural disasters and severe winter.',
    status: 'ongoing',
    status_bn: 'চলমান',
    image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    target_amount: 50000,
    raised_amount: 28500,
    category_bn: 'দুর্যোগ সহায়তা',
  },
  {
    id: 4,
    title_bn: 'হুইলচেয়ার ও মাসিক ওষুধ সরবরাহ',
    title_en: 'Wheelchair & Monthly Medicine Supply',
    description_bn: 'শারীরিক প্রতিবন্ধী ও পক্ষাঘাতগ্রস্ত অসহায় মানুষের স্বাভাবিক চলাচল নিশ্চিতকরণে হুইলচেয়ার উপহার প্রদান।',
    description_en: 'Gifting wheelchairs and recurring medicines to ensure mobility for disabled and paralyzed individuals.',
    status: 'ongoing',
    status_bn: 'চলমান',
    image_url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    target_amount: 35000,
    raised_amount: 19000,
    category_bn: 'প্রতিবন্ধী পুনর্বাসন',
  },
  {
    id: 5,
    title_bn: 'সবুজ পৃথিবী গড়তে বৃক্ষরোপণ কার্যক্রম',
    title_en: 'Tree Plantation for a Greener World',
    description_bn: '“একটি গাছ একটি প্রাণ”—পরিবেশের ভারসাম্য রক্ষায় নওগাঁ জেলাজুড়ে ফলজ ও বনজ চারাগাছ রোপণ ও বিতরণ।',
    description_en: 'Planting and distributing fruit and timber saplings across Naogaon district to protect the climate.',
    status: 'completed',
    status_bn: 'সম্পন্ন',
    image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    target_amount: 20000,
    raised_amount: 20000,
    category_bn: 'পরিবেশ উন্নয়ন',
  },
  {
    id: 6,
    title_bn: 'অসহায় পরিবার পুনর্বাসন ও স্বাবলম্বিতা',
    title_en: 'Rehabilitation & Self-Reliance for Destitute Families',
    description_bn: 'ভিক্ষাবৃত্তি নয়, কর্মসংস্থান—অসহায় পরিবারের হাতে সেলাই মেশিন, ভ্যানগাড়ি ও ক্ষুদ্র ব্যবসার পুঁজি হস্তান্তর।',
    description_en: 'Providing sewing machines, vans, and small capital to help destitute families become self-reliant.',
    status: 'ongoing',
    status_bn: 'চলমান',
    image_url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=800&q=80',
    target_amount: 60000,
    raised_amount: 42000,
    category_bn: 'পুনর্বাসন',
  },
];

const ProgramsPreview = () => {
  const { language } = useLanguage();
  const [selectedProgram, setSelectedProgram] = useState<ProgramItem | null>(null);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const bkashNumber = '01711050841';
  const nagadNumber = '01711050841';

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast({
      title: language === 'bn' ? 'নম্বর কপি হয়েছে!' : 'Number copied!',
      description: text,
    });
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleOpenDonate = (program: ProgramItem) => {
    setSelectedProgram(program);
    setIsDonateOpen(true);
  };

  const handleOpenDetail = (program: ProgramItem) => {
    setSelectedProgram(program);
    setIsDetailOpen(true);
  };

  return (
    <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200/80" id="homeProgramsSection">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Title matching Helpline Reference */}
        <div className="text-center mb-6">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            {language === 'bn' ? 'আমাদের কার্যক্রম' : 'Our Activities & Programs'}
          </h2>

          {/* Section Divider (Line - Dot - Line) */}
          <div className="flex items-center justify-center gap-2 mt-3.5 mb-5">
            <div className="w-14 h-0.5 bg-emerald-600/40 rounded-full" />
            <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse" />
            <div className="w-14 h-0.5 bg-emerald-600/40 rounded-full" />
          </div>

          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            {language === 'bn'
              ? 'মানুষের সেবায় নিবেদিত সময়ের বাতিঘর-এর নানামুখী মানবিক ও সামাজিক উদ্যোগ'
              : 'Diverse humanitarian and social welfare initiatives dedicated to serving humanity'}
          </p>
        </div>

        {/* Options Requested by User: চলমান কার্যক্রম / তথ্য দিন */}
        <div className="flex justify-center items-center gap-3 mb-10 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 text-white font-bold text-sm shadow-md hover:bg-emerald-800 transition-all transform hover:-translate-y-0.5 border border-emerald-600"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping inline-block" />
            <span>{language === 'bn' ? 'চলমান কার্যক্রম' : 'Ongoing Programs'}</span>
            <Layers className="w-4 h-4 ml-0.5 opacity-90" />
          </button>

          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-gray-800 hover:text-emerald-700 font-bold text-sm shadow-sm hover:shadow-md transition-all border border-slate-300 hover:border-emerald-500"
          >
            <Megaphone className="w-4 h-4 text-rose-600" />
            <span>{language === 'bn' ? 'তথ্য দিন / আবেদন' : 'Submit Information'}</span>
          </button>
        </div>

        {/* Programs Grid: 3 cards per row on md/lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {defaultPrograms.map((prog) => {
            const isOngoing = prog.status === 'ongoing';
            const percent = prog.target_amount && prog.raised_amount 
              ? Math.min(100, Math.round((prog.raised_amount / prog.target_amount) * 100))
              : 0;

            const title = language === 'bn' ? prog.title_bn : prog.title_en;
            const description = language === 'bn' ? prog.description_bn : prog.description_en;

            return (
              <div
                key={prog.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-600/50 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Program Image with Status Badge */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={prog.image_url}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${
                        isOngoing ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}>
                        {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        {language === 'bn' ? prog.status_bn : (isOngoing ? 'Ongoing' : 'Completed')}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <h3 className="font-heading font-bold text-gray-900 text-lg leading-snug line-clamp-1 mb-2 group-hover:text-emerald-700 transition-colors">
                      {title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                      {description}
                    </p>

                    {/* Financial Progress Bar */}
                    {prog.target_amount && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-gray-500 font-semibold">
                            {language === 'bn' ? 'আর্থিক প্রয়োজন:' : 'Target:'}
                          </span>
                          <span className="font-bold text-emerald-700 font-mono">
                            ৳{prog.raised_amount?.toLocaleString('en-US')} / ৳{prog.target_amount?.toLocaleString('en-US')}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-right text-[11px] text-gray-500 font-semibold mt-1">
                          {percent}% {language === 'bn' ? 'সংগৃহীত' : 'Raised'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons: বিস্তারিত & সহায়তা দিন */}
                <div className="p-5 pt-0 mt-2 flex gap-2 items-center border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(prog)}
                    className="flex-1 text-center py-2 px-3 rounded-full border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-bold transition-all duration-200"
                  >
                    {language === 'bn' ? 'বিস্তারিত' : 'Details'}
                  </button>

                  {isOngoing && (
                    <button
                      type="button"
                      onClick={() => handleOpenDonate(prog)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 shrink-0"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>{language === 'bn' ? 'সহায়তা দিন' : 'Donate'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Programs Button */}
        <div className="text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-700 hover:text-white rounded-full px-8 py-3 font-bold shadow-sm transition-all duration-300 inline-flex items-center gap-2.5 text-base"
          >
            <Link to="/programs">
              <LayoutGrid className="w-4 h-4" />
              <span>{language === 'bn' ? 'সকল কার্যক্রম দেখুন' : 'View All Programs'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Quick Donate Modal ── */}
      <Dialog open={isDonateOpen} onOpenChange={setIsDonateOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold w-fit mb-1">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'bn' ? 'মানবিক সহায়তা প্রদান' : 'Humanitarian Support'}</span>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {selectedProgram ? (language === 'bn' ? selectedProgram.title_bn : selectedProgram.title_en) : 'দান করুন'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              {language === 'bn'
                ? 'আপনার সামান্য অনুদান যেকোনো অসহায় ব্যক্তির মুখে হাসি ফোটাতে পারে।'
                : 'Your humble contribution can bring hope and relief to people in need.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* bKash Card */}
            <div className="p-3.5 rounded-xl border border-pink-200 bg-pink-50/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="bg-[#e2136e] text-white text-xs font-bold px-2.5 py-1 rounded-md">
                  bKash
                </span>
                <div>
                  <div className="font-mono font-bold text-gray-900 text-base">{bkashNumber}</div>
                  <div className="text-[11px] text-gray-500">Personal (Send Money)</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${bkashNumber}`}
                  className="p-2 rounded-full border border-pink-300 text-[#e2136e] hover:bg-pink-100 transition-colors"
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bkashNumber, 'bkash')}
                  className="p-2 rounded-full bg-[#e2136e] text-white hover:bg-pink-700 transition-colors"
                  title="Copy"
                >
                  {copiedType === 'bkash' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nagad Card */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                  Nagad
                </span>
                <div>
                  <div className="font-mono font-bold text-gray-900 text-base">{nagadNumber}</div>
                  <div className="text-[11px] text-gray-500">Personal (Send Money)</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${nagadNumber}`}
                  className="p-2 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors"
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(nagadNumber, 'nagad')}
                  className="p-2 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                  title="Copy"
                >
                  {copiedType === 'nagad' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-800 mb-1">
                {language === 'bn' ? 'অনুদান পাঠানোর পর করণীয়:' : 'After sending donation:'}
              </p>
              {language === 'bn' 
                ? 'অনুগ্রহ করে ট্রানজেকশন আইডি (TrxID) বা স্ক্রিনশট সহ আমাদের হেল্পলাইন নম্বরে (01916314315) একটি বার্তা দিন।' 
                : 'Please send TrxID or screenshot to our helpline number (01916314315).'}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Detail Modal ── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg p-6 bg-white rounded-2xl">
          {selectedProgram && (
            <div>
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-4 bg-slate-100">
                <img
                  src={selectedProgram.image_url}
                  alt={selectedProgram.title_bn}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  {language === 'bn' ? selectedProgram.status_bn : selectedProgram.status}
                </span>
              </div>

              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 leading-snug">
                  {language === 'bn' ? selectedProgram.title_bn : selectedProgram.title_en}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-700 leading-relaxed mt-2 pt-2 border-t">
                  {language === 'bn' ? selectedProgram.description_bn : selectedProgram.description_en}
                </DialogDescription>
              </DialogHeader>

              {selectedProgram.target_amount && (
                <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1 text-gray-600">
                    <span>{language === 'bn' ? 'আর্থিক লক্ষ্যমাত্রা:' : 'Financial Target:'}</span>
                    <span className="text-emerald-700 font-bold font-mono">
                      ৳{selectedProgram.raised_amount?.toLocaleString()} / ৳{selectedProgram.target_amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ 
                        width: `${Math.min(100, Math.round(((selectedProgram.raised_amount || 0) / selectedProgram.target_amount) * 100))}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailOpen(false);
                    setIsDonateOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow inline-flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{language === 'bn' ? 'এই কার্যক্রমে অনুদান দিন' : 'Donate Now'}</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Information / Assistance Request Modal ── */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold w-fit mb-1">
              <Megaphone className="w-3.5 h-3.5 text-rose-600" />
              <span>{language === 'bn' ? 'তথ্য দিন / সহায়তা আবেদন' : 'Information & Support'}</span>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {language === 'bn' ? 'অসহায় ব্যক্তির তথ্য বা অভিযোগ দিন' : 'Submit Information or Appeal'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              {language === 'bn'
                ? 'আপনার এলাকায় কোনো অসহায় বা দুস্থ ব্যক্তির সহায়তার প্রয়োজন হলে আমাদের সাথে সরাসরি যোগাযোগ করুন।'
                : 'If someone in your area needs emergency humanitarian help, inform us immediately.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-sm text-gray-700">
            <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{language === 'bn' ? 'জরুরি হেল্পলাইন নম্বর' : 'Helpline Hotline'}</div>
                <div className="text-xs text-emerald-700 font-mono font-bold mt-0.5">01916314315</div>
              </div>
              <a
                href="tel:01916314315"
                className="py-1.5 px-3 rounded-full bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>{language === 'bn' ? 'কল দিন' : 'Call'}</span>
              </a>
            </div>

            <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">WhatsApp</div>
                <div className="text-xs text-emerald-700 font-mono font-bold mt-0.5">01916314315</div>
              </div>
              <a
                href="https://wa.me/01916314315"
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 rounded-full bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1"
              >
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ProgramsPreview;
