import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentGatewayLogos } from '@/hooks/usePaymentGatewayLogos';
import { 
  ShieldCheck, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
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

  const dueId = searchParams.get('dueId');
  const methodParam = (searchParams.get('method') as PaymentMethodId) || null;
  const rawAmountParam = parseFloat(searchParams.get('amount') || '0');
  const purposeParam = searchParams.get('purpose');

  // Fetch due record directly from database if dueId is provided
  const { data: dueRecord, isLoading: isDueLoading } = useQuery({
    queryKey: ['due-record-for-payment', dueId],
    queryFn: async () => {
      if (!dueId) return null;
      const { data, error } = await supabase
        .from('member_dues')
        .select('*, members(id, full_name, member_id, phone)')
        .eq('id', dueId)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!dueId,
  });

  // Calculate live amount & purpose
  const amount = dueRecord?.amount ?? (rawAmountParam > 0 ? rawAmountParam : 100);
  const purpose = dueRecord?.month_year 
    ? `${dueRecord.month_year} মাসের সদস্য চাঁদা`
    : (purposeParam || 'সদস্য মাসিক চাঁদা');

  const [activeMethod, setActiveMethod] = useState<PaymentMethodId | null>(methodParam);
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
          // Inactive gateway: clear active method
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
    if (dueId) params.set('dueId', dueId);
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
    console.log('Payment recorded successfully:', trxId, details);
  };

  if (isDueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDF2ED] text-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
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
            dueId={dueId}
            purpose={purpose}
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
            dueId={dueId}
            purpose={purpose}
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
            amount={amount}
            invoiceNo={invoiceNo}
            recipientNumber={getRecipientNumber(activeMethod)}
            instructions={getInstructions(activeMethod)}
            customLogoUrl={logos[activeMethod] || null}
            dueId={dueId}
            purpose={purpose}
            onClose={handleCloseActiveView}
            onSuccess={handlePaymentSuccess}
          />
        )}

      </div>
    </div>
  );
};

export default OnlinePaymentPage;
