import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentGatewayLogos } from '@/hooks/usePaymentGatewayLogos';
import { resolveMagicPaymentLink, markMagicLinkUsed } from '@/lib/magicLinkUtils';
import { 
  ShieldCheck, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Home,
  Sparkles,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import OnlinePaymentSection, { type PaymentMethodId } from '@/components/payment/OnlinePaymentSection';
import BkashPaymentView from '@/components/payment/BkashPaymentView';
import NagadPaymentView from '@/components/payment/NagadPaymentView';
import GenericMobilePaymentView from '@/components/payment/GenericMobilePaymentView';

export const OnlinePaymentPage = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logos } = usePaymentGatewayLogos();

  const tokenParam = searchParams.get('t') || searchParams.get('token');
  const dueIdParam = searchParams.get('dueId');
  const methodParam = (searchParams.get('method') as PaymentMethodId) || null;
  const rawAmountParam = parseFloat(searchParams.get('amount') || '0');
  const purposeParam = searchParams.get('purpose');

  // 1. Resolve Magic Payment Link if token parameter exists
  const { data: magicResult, isLoading: isMagicLoading } = useQuery({
    queryKey: ['magic-payment-link', tokenParam],
    queryFn: async () => {
      if (!tokenParam) return null;
      return await resolveMagicPaymentLink(tokenParam);
    },
    enabled: !!tokenParam,
    staleTime: 1000 * 5, // 5s
  });

  const magicRecord = magicResult?.record;

  // 2. Fetch due record directly from database if dueId is provided
  const targetDueId = magicRecord?.dueId || dueIdParam;
  const { data: dueRecord, isLoading: isDueLoading } = useQuery({
    queryKey: ['due-record-for-payment', targetDueId],
    queryFn: async () => {
      if (!targetDueId) return null;
      const { data, error } = await supabase
        .from('member_dues')
        .select('*, members(id, full_name, member_id, phone)')
        .eq('id', targetDueId)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!targetDueId,
  });

  // Calculate live amount & purpose
  const amount = magicRecord?.amount ?? dueRecord?.amount ?? (rawAmountParam > 0 ? rawAmountParam : 100);
  const purpose = magicRecord?.purpose 
    ? magicRecord.purpose
    : dueRecord?.month_year 
      ? `${dueRecord.month_year} মাসের সদস্য চাঁদা`
      : (purposeParam || 'সদস্য মাসিক চাঁদা');

  // Magic link personalized member info
  const magicMember = magicRecord ? {
    id: magicRecord.memberId,
    full_name: magicRecord.memberName,
    member_id: magicRecord.memberDisplayId,
    phone: magicRecord.memberPhone,
    month: magicRecord.month,
  } : dueRecord?.members ? {
    id: dueRecord.members.id,
    full_name: dueRecord.members.full_name,
    member_id: dueRecord.members.member_id,
    phone: dueRecord.members.phone,
    month: dueRecord.month_year,
  } : null;

  const [activeMethod, setActiveMethod] = useState<PaymentMethodId | null>(methodParam);
  const [submittedTrx, setSubmittedTrx] = useState<string | null>(null);
  const [invoiceNo] = useState<string>(() => {
    return 'SB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  });

  // Fetch live active gateway records from database
  const { data: dbMethods } = useQuery({
    queryKey: ['public-payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*');
      if (error) return [];
      return data || [];
    },
    staleTime: 1000 * 30, // 30s
  });

  // Synchronize method param & verify it's active in database
  useEffect(() => {
    if (methodParam && ['bkash', 'nagad', 'rocket', 'upay', 'cellfin', 'tap'].includes(methodParam)) {
      if (dbMethods && dbMethods.length > 0) {
        const found = dbMethods.find((m) => m.method_type === methodParam);
        if (found && found.is_active === false) {
          setActiveMethod(null);
          return;
        }
      }
      setActiveMethod(methodParam);
    }
  }, [methodParam, dbMethods]);

  const getGatewayRecord = (method: PaymentMethodId) => {
    return dbMethods?.find((m) => m.method_type === method) || null;
  };

  const getRecipientNumber = (method: PaymentMethodId) => {
    const record = getGatewayRecord(method);
    if (record?.account_number && record.account_number.trim() && record.account_number !== '01XXXXXXXXX') {
      return record.account_number.trim();
    }
    return '01616355160';
  };

  const getInstructions = (method: PaymentMethodId) => {
    const record = getGatewayRecord(method);
    return record?.instructions_bn || null;
  };

  const handleSelectPayment = (method: PaymentMethodId, selectedAmount: number) => {
    setActiveMethod(method);
    const params = new URLSearchParams(searchParams);
    params.set('method', method);
    params.set('amount', String(selectedAmount));
    if (targetDueId) params.set('dueId', targetDueId);
    if (purpose) params.set('purpose', purpose);
    setSearchParams(params);
  };

  const handleCloseActiveView = () => {
    setActiveMethod(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('method');
    setSearchParams(newParams);
  };

  const handlePaymentSuccess = (trxId: string, details: any) => {
    setSubmittedTrx(trxId);
    if (tokenParam) {
      markMagicLinkUsed(tokenParam, trxId, activeMethod || 'bkash');
    }
  };

  if (isMagicLoading || isDueLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#EDF2ED] text-slate-800 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#0B6B3A]" />
        <p className="text-sm font-medium text-slate-600">ম্যাজিক পেমেন্ট লিংক যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  // A. Special View: Already Paid
  if (magicResult?.status === 'already_paid') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EDF2ED] via-[#F4F6F4] to-[#E8EFE8] flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0B6B3A] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              পরিশোধিত ও সক্রিয়
            </span>
            <h2 className="text-xl font-heading font-black text-slate-900 mt-2">
              চাঁদা ইতোমধ্যে পরিশোধিত!
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {magicResult.message || 'আপনার এই মাসের সদস্য চাঁদা সফলভাবে জমা ও অনুমোদন সম্পন্ন হয়েছে।'}
            </p>
          </div>

          {magicRecord && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">সদস্যের নাম:</span>
                <strong className="text-slate-900">{magicRecord.memberName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">সদস্য আইডি:</span>
                <strong className="text-emerald-700">{magicRecord.memberDisplayId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">পরিশোধের মাস:</span>
                <strong className="text-slate-900">{magicRecord.month}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-bold">পরিশোধিত পরিমাণ:</span>
                <strong className="text-emerald-800 text-sm">৳{magicRecord.amount}</strong>
              </div>
            </div>
          )}

          <Button
            onClick={() => navigate('/')}
            className="w-full bg-[#0B6B3A] hover:bg-[#09542e] text-white rounded-xl font-bold py-2.5 shadow-md gap-2"
          >
            <Home className="w-4 h-4" />
            <span>হোম পেজে ফিরে যান</span>
          </Button>
        </div>
      </div>
    );
  }

  // B. Special View: Pending Verification or Already Used
  if (magicResult?.status === 'pending_verification' || magicResult?.status === 'already_used') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EDF2ED] via-[#F4F6F4] to-[#E8EFE8] flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Clock className="w-9 h-9" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              যাচাইকরণ প্রক্রিয়াধীন
            </span>
            <h2 className="text-xl font-heading font-black text-slate-900 mt-2">
              পেমেন্ট জমা হয়েছে!
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {magicResult.message || 'আপনার সাবমিট করা পেমেন্ট তথ্যটি কেন্দ্রীয় কমিটির যাচাইকরণের অপেক্ষায় রয়েছে।'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left text-xs space-y-1.5 text-slate-700">
            {magicRecord?.memberName && (
              <div className="flex justify-between">
                <span className="text-slate-500">সদস্য:</span>
                <strong className="text-slate-900">{magicRecord.memberName} ({magicRecord.memberDisplayId})</strong>
              </div>
            )}
            {magicRecord?.transactionId && (
              <div className="flex justify-between">
                <span className="text-slate-500">জমা দেওয়া TrxID:</span>
                <strong className="font-mono text-amber-800 text-sm">{magicRecord.transactionId}</strong>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">টাকার পরিমাণ:</span>
              <strong className="text-emerald-800 font-bold">৳{magicRecord?.amount || amount}</strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            যাচাইকরণ সম্পন্ন হওয়ার সাথে সাথে আপনার নিবন্ধিত ফোনে কনফার্মেশন এসএমএস পাঠানো হবে।
          </p>

          <Button
            onClick={() => navigate('/')}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold py-2.5 shadow-md gap-2"
          >
            <Home className="w-4 h-4" />
            <span>হোম পেজে ফিরে যান</span>
          </Button>
        </div>
      </div>
    );
  }

  // C. Special View: Expired Token
  if (magicResult?.status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EDF2ED] via-[#F4F6F4] to-[#E8EFE8] flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-red-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-9 h-9" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
              মেয়াদ উত্তীর্ণ লিংক
            </span>
            <h2 className="text-xl font-heading font-black text-slate-900 mt-2">
              লিংকের মেয়াদ শেষ হয়েছে
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {magicResult.message || 'এই ম্যাজিক পেমেন্ট লিংকটির মেয়াদ উত্তীর্ণ হয়ে গেছে।'}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                navigate('/payment');
              }}
              className="w-full bg-[#0B6B3A] hover:bg-[#09542e] text-white rounded-xl font-bold py-2.5 shadow-md"
            >
              সাধারণ পেমেন্ট করুন
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full rounded-xl"
            >
              হোম পেজে যান
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EDF2ED] via-[#F4F6F4] to-[#E8EFE8] flex flex-col justify-start sm:justify-center items-center py-2 sm:py-8 px-2 sm:px-4">
      {/* Background soft ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Centered Mobile-Responsive Container */}
      <div className="w-full max-w-lg relative z-10">
        
        {/* Conditional Gateway Views */}
        {!activeMethod && (
          <OnlinePaymentSection
            amount={amount}
            dueId={targetDueId}
            purpose={purpose}
            magicMember={magicMember}
            onSelectPayment={handleSelectPayment}
            onClose={() => navigate('/member/dues')}
          />
        )}

        {activeMethod === 'bkash' && (
          <BkashPaymentView
            amount={amount}
            invoiceNo={invoiceNo}
            recipientNumber={getRecipientNumber('bkash')}
            instructions={getInstructions('bkash')}
            customLogoUrl={logos['bkash'] || null}
            dueId={targetDueId}
            purpose={purpose}
            magicMember={magicMember}
            magicToken={tokenParam}
            onClose={handleCloseActiveView}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {activeMethod === 'nagad' && (
          <NagadPaymentView
            amount={amount}
            invoiceNo={invoiceNo}
            recipientNumber={getRecipientNumber('nagad')}
            instructions={getInstructions('nagad')}
            customLogoUrl={logos['nagad'] || null}
            dueId={targetDueId}
            purpose={purpose}
            magicMember={magicMember}
            magicToken={tokenParam}
            onClose={handleCloseActiveView}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {(activeMethod === 'rocket' || activeMethod === 'upay' || activeMethod === 'cellfin' || activeMethod === 'tap') && (
          <GenericMobilePaymentView
            methodId={activeMethod}
            methodName={activeMethod.toUpperCase()}
            amount={amount}
            invoiceNo={invoiceNo}
            recipientNumber={getRecipientNumber(activeMethod)}
            instructions={getInstructions(activeMethod)}
            customLogoUrl={logos[activeMethod] || null}
            dueId={targetDueId}
            purpose={purpose}
            magicMember={magicMember}
            magicToken={tokenParam}
            onClose={handleCloseActiveView}
            onSuccess={handlePaymentSuccess}
          />
        )}

      </div>
    </div>
  );
};

export default OnlinePaymentPage;
