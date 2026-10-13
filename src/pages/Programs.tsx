import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { defaultPrograms, ProgramItem } from '@/components/home/ProgramsPreview';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, 
  Phone, 
  Copy, 
  Check, 
  Layers, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const Programs = () => {
  const { language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [selectedProgram, setSelectedProgram] = useState<ProgramItem | null>(null);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const bkashNumber = '01711050841';
  const nagadNumber = '01711050841';

  // Fetch events from Supabase to merge if any exist
  const { data: dbEvents } = useQuery({
    queryKey: ['public-events-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('event_date', { ascending: false });

      if (error) {
        console.warn('Error fetching events:', error);
        return [];
      }
      return data || [];
    },
  });

  // Map db events to ProgramItem format
  const mappedDbEvents: ProgramItem[] = (dbEvents || []).map((ev) => ({
    id: ev.id,
    title_bn: ev.title_bn,
    title_en: ev.title_en || ev.title_bn,
    description_bn: ev.description_bn || '',
    description_en: ev.description_en || ev.description_bn || '',
    status: new Date(ev.event_date) >= new Date() ? 'ongoing' : 'completed',
    status_bn: new Date(ev.event_date) >= new Date() ? 'চলমান' : 'সম্পন্ন',
    image_url: ev.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    date: ev.event_date,
  }));

  // Combine default rich programs with any DB events (avoid duplicates)
  const allPrograms: ProgramItem[] = [
    ...defaultPrograms,
    ...mappedDbEvents.filter((e) => !defaultPrograms.some((dp) => dp.title_bn === e.title_bn)),
  ];

  const filteredPrograms = allPrograms.filter((prog) => {
    if (activeFilter === 'all') return true;
    return prog.status === activeFilter;
  });

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
    <MainLayout>
      <div className="bg-slate-50/70 min-h-screen py-10 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
            <Link to="/" className="hover:text-emerald-700 transition-colors">
              {language === 'bn' ? 'হোম' : 'Home'}
            </Link>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">
              {language === 'bn' ? 'কার্যক্রম' : 'Programs'}
            </span>
          </div>

          {/* Page Heading matching Helpline Hello Naogaon */}
          <div className="text-center mb-10 md:mb-14">
            <h1 className="text-3xl md:text-5xl font-extrabold text-emerald-800 tracking-tight font-heading">
              {language === 'bn' ? 'আমাদের কার্যক্রমসমূহ' : 'Our Programs & Activities'}
            </h1>
            <p className="text-gray-600 text-sm md:text-base mt-2 max-w-2xl mx-auto">
              {language === 'bn' 
                ? 'সময়ের বাতিঘর-এর সকল উদ্যোগ ও চলমান কার্যক্রমসমূহ' 
                : 'All humanitarian initiatives and ongoing programs of Samoyer Batighor'}
            </p>

            {/* Divider */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-14 h-0.5 bg-emerald-600/40 rounded-full" />
              <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse" />
              <div className="w-14 h-0.5 bg-emerald-600/40 rounded-full" />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex justify-center items-center gap-2 md:gap-3 mb-10 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm ${
                activeFilter === 'all'
                  ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                  : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {language === 'bn' ? 'সকল কার্যক্রম' : 'All Programs'} ({allPrograms.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('ongoing')}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm ${
                activeFilter === 'ongoing'
                  ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                  : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>{language === 'bn' ? 'চলমান' : 'Ongoing'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('completed')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm ${
                activeFilter === 'completed'
                  ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                  : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {language === 'bn' ? 'সম্পন্ন' : 'Completed'}
            </button>
          </div>

          {/* Programs Grid: 3 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredPrograms.map((prog) => {
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
                    {/* Image with 250px height like reference */}
                    <div className="relative h-[240px] sm:h-[250px] overflow-hidden bg-slate-100">
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

                    {/* Body */}
                    <div className="p-5">
                      <h2 className="font-heading font-bold text-gray-900 text-lg leading-snug line-clamp-1 mb-2 group-hover:text-emerald-700 transition-colors">
                        {title}
                      </h2>
                      <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                        {description}
                      </p>

                      {/* Financial Progress Bar */}
                      {prog.target_amount && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-gray-500 font-semibold">
                              {language === 'bn' ? 'আর্থিক প্রয়োজন:' : 'Target Need:'}
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
        </div>
      </div>

      {/* ── Donation Modal ── */}
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
                  <span>{language === 'bn' ? 'এই কার্যক্রমে অনুদান দিন' : 'Donate to this Program'}</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Programs;
