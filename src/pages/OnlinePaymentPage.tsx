import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  HelpCircle, 
  Phone, 
  Mail, 
  Lock, 
  Sparkles,
  ArrowLeft,
  Building2
} from 'lucide-react';
import OnlinePaymentSection, { type PaymentMethodId } from '@/components/payment/OnlinePaymentSection';
import BkashPaymentView from '@/components/payment/BkashPaymentView';
import NagadPaymentView from '@/components/payment/NagadPaymentView';
import GenericMobilePaymentView from '@/components/payment/GenericMobilePaymentView';

export const OnlinePaymentPage = () => {
  const { language } = useLanguage();
  const { logoUrl } = useSiteLogo();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const methodParam = (searchParams.get('method') as PaymentMethodId) || null;
  const amountParam = parseFloat(searchParams.get('amount') || '10');
  const dueId = searchParams.get('dueId');
  const purpose = searchParams.get('purpose') || 'সাধারণ অনুদান ও সদস্য চাঁদা';

  const [activeMethod, setActiveMethod] = useState<PaymentMethodId | null>(methodParam);
  const [currentAmount, setCurrentAmount] = useState<number>(isNaN(amountParam) ? 10 : amountParam);
  const [invoiceNo, setInvoiceNo] = useState<string>(() => {
    return 'SB' + Math.random().toString(36).substring(2, 9).toUpperCase();
  });

  // Keep in sync with URL
  useEffect(() => {
    if (methodParam && ['bkash', 'nagad', 'rocket', 'upay', 'cellfin', 'tap'].includes(methodParam)) {
      setActiveMethod(methodParam);
    }
    if (!isNaN(amountParam) && amountParam > 0) {
      setCurrentAmount(amountParam);
    }
  }, [methodParam, amountParam]);

  // Fetch live gateway numbers from database
  const { data: dbMethods } = useQuery({
    queryKey: ['public-payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);
      if (error) return [];
      return data || [];
    },
  });

  const getRecipientNumber = (method: PaymentMethodId) => {
    const found = dbMethods?.find((m) => m.method_type === method);
    if (found?.account_number && found.account_number !== '01XXXXXXXXX') {
      return found.account_number;
    }
    // Fallback numbers
    switch (method) {
      case 'bkash':
        return '01616355160';
      case 'nagad':
        return '01616355160';
      case 'rocket':
        return '01616355160';
      default:
        return '01616355160';
    }
  };

  const handleSelectPayment = (method: PaymentMethodId, amt: number) => {
    setActiveMethod(method);
    setCurrentAmount(amt);
    setSearchParams({
      method,
      amount: String(amt),
      ...(dueId ? { dueId } : {}),
      purpose,
    });
  };

  const handleCloseActiveView = () => {
    setActiveMethod(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('method');
    setSearchParams(newParams);
  };

  const handlePaymentSuccess = (trxId: string, details: any) => {
    console.log('Payment success:', trxId, details);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-[#F4FAF6] via-white to-[#EAF5EE] py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Title Section with Signature Somoyer Batighor Design */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#0B6B3A]" />
              <span>{language === 'bn' ? 'অফিসিয়াল নিরাপদ অনলাইন পেমেন্ট' : 'Official Secure Payment'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-[#14231B] tracking-tight">
              {language === 'bn' ? 'ডিজিটাল পেমেন্ট ' : 'Digital Payment '}
              <span className="text-[#0B6B3A] relative inline-block">
                গেটওয়ে
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  height="8"
                  viewBox="0 0 100 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5.5C25 2 75 2 99 5.5"
                    stroke="#9BD038"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {language === 'bn'
                ? 'বিকাশ, নগদ, রকেট, উপায়, সেলফিন বা ট্যাপ পে-এর মাধ্যমে আপনার সদস্য চাঁদা ও অনুদান সম্পূর্ণ নিরাপদে প্রদান করুন।'
                : 'Send your membership dues and welfare donations seamlessly via bKash, Nagad, Rocket, Upay, Cellfin or Tap.'}
            </p>
          </div>

          {/* Main Content Grid: Left Information Panel + Right Interactive Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Organization Trust & Instructions (Shown gracefully on all screen sizes) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Trust & Transparency Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.05)] border border-emerald-900/10 space-y-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-[#0B6B3A] shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                      নিরাপদ ও নির্ভরযোগ্য লেনদেন
                    </h3>
                    <p className="text-xs text-slate-500">স্বচ্ছতা ও জবাবদিহিতায় সময়ের বাতিঘর</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <div className="p-3.5 rounded-2xl bg-[#F7FCF9] border border-emerald-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">১</span>
                    <p className="leading-relaxed">
                      পেমেন্ট মেথড নির্বাচন করে <strong>Pay Now</strong> বাটনে চাপ দিন এবং সংশ্লিষ্ট পেমেন্ট পেজে প্রবেশ করুন।
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7FCF9] border border-emerald-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">২</span>
                    <p className="leading-relaxed">
                      প্রদর্শিত নির্দিষ্ট নম্বরে আপনার অ্যাপ থেকে <strong>Send Money</strong> সম্পন্ন করুন।
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7FCF9] border border-emerald-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">৩</span>
                    <p className="leading-relaxed">
                      টাকা পাঠানোর পর প্রাপ্ত <strong>Transaction ID (TrxID)</strong> ইনপুট দিয়ে সাবমিট করলেই রসিদ তৈরি হবে।
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>২৫৬-বিট এনক্রিপশন সুরক্ষিত</span>
                  </span>
                  <span className="font-semibold text-emerald-700">তাৎক্ষণিক অটো-রেকর্ড</span>
                </div>
              </div>

              {/* 24/7 Helpline & Support */}
              <div className="bg-gradient-to-br from-[#09351D] to-[#0B6B3A] text-white rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base">পেমেন্ট সংক্রান্ত সহায়তার প্রয়োজন?</h4>
                    <p className="text-xs text-white/80">আমাদের প্রতিনিধি দল ২৪ ঘণ্টা আপনার সহায়তায় প্রস্তুত</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                    <span className="text-white/70 block text-[11px]">হটলাইন নম্বর:</span>
                    <span className="font-mono font-bold text-sm text-yellow-300">০১৭০০-০০০০০০</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                    <span className="text-white/70 block text-[11px]">ইমেইল সাপোর্ট:</span>
                    <span className="font-medium text-xs truncate block text-emerald-200">support@somoyerbatighor.org</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Payment Terminal View */}
            <div className="lg:col-span-6 flex justify-center">
              
              {/* Conditional Rendering of Payment Views */}
              {!activeMethod && (
                <OnlinePaymentSection
                  initialAmount={currentAmount}
                  dueId={dueId}
                  purpose={purpose}
                  onSelectPayment={handleSelectPayment}
                />
              )}

              {activeMethod === 'bkash' && (
                <BkashPaymentView
                  amount={currentAmount}
                  invoiceNo={invoiceNo}
                  recipientNumber={getRecipientNumber('bkash')}
                  dueId={dueId}
                  purpose={purpose}
                  onClose={handleCloseActiveView}
                  onSuccess={handlePaymentSuccess}
                />
              )}

              {activeMethod === 'nagad' && (
                <NagadPaymentView
                  amount={currentAmount}
                  invoiceNo={invoiceNo}
                  recipientNumber={getRecipientNumber('nagad')}
                  dueId={dueId}
                  purpose={purpose}
                  onClose={handleCloseActiveView}
                  onSuccess={handlePaymentSuccess}
                />
              )}

              {(activeMethod === 'rocket' || activeMethod === 'upay' || activeMethod === 'cellfin' || activeMethod === 'tap') && (
                <GenericMobilePaymentView
                  methodId={activeMethod}
                  methodName={activeMethod.toUpperCase()}
                  amount={currentAmount}
                  invoiceNo={invoiceNo}
                  recipientNumber={getRecipientNumber(activeMethod)}
                  dueId={dueId}
                  purpose={purpose}
                  onClose={handleCloseActiveView}
                  onSuccess={handlePaymentSuccess}
                />
              )}

            </div>

          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default OnlinePaymentPage;

