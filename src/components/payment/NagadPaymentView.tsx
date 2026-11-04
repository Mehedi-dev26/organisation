import React, { useState, useEffect } from 'react';
import { NagadLogo } from './PaymentLogos';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  X, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  RotateCcw,
  Loader2,
  ShoppingCart,
  Smartphone
} from 'lucide-react';

interface NagadPaymentViewProps {
  amount: number;
  invoiceNo: string;
  recipientNumber?: string;
  dueId?: string | null;
  purpose?: string;
  onClose: () => void;
  onSuccess: (trxId: string, details: any) => void;
}

export const NagadPaymentView: React.FC<NagadPaymentViewProps> = ({
  amount,
  invoiceNo,
  recipientNumber = '01616355160',
  dueId,
  purpose = 'সময়ের বাতিঘর চাঁদা ও অনুদান',
  onClose,
  onSuccess,
}) => {
  const { logoUrl } = useSiteLogo();
  const { toast } = useToast();
  const { user } = useAuth();

  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [phase, setPhase] = useState<'account' | 'verify' | 'success'>('account');
  const [senderAccount, setSenderAccount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // 3-minute countdown timer
  const [secondsLeft, setSecondsLeft] = useState(180);

  useEffect(() => {
    if (phase !== 'verify') return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(recipientNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast({
      title: 'নম্বর কপি হয়েছে!',
      description: recipientNumber,
    });
  };

  const handleProceed = () => {
    const clean = senderAccount.replace(/\D/g, '');
    if (clean.length < 11) {
      toast({
        title: 'ভুল মোবাইল নম্বর',
        description: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের নগদ একাউন্ট নম্বর দিন',
        variant: 'destructive',
      });
      return;
    }
    setPhase('verify');
  };

  const handleVerifyTrxId = async () => {
    if (!trxId.trim() || trxId.trim().length < 4) {
      toast({
        title: 'ভুল TrxID',
        description: 'অনুগ্রহ করে নগদ থেকে প্রাপ্ত সঠিক ট্রানজেকশন আইডি দিন',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);

    try {
      if (dueId) {
        await supabase
          .from('member_dues')
          .update({
            transaction_id: trxId.trim().toUpperCase(),
            payment_method: 'nagad',
            payment_status: 'submitted',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', dueId);
      }

      const { data: memberProfile } = user?.id 
        ? await supabase.from('members').select('id, full_name, member_id').eq('user_id', user.id).maybeSingle()
        : { data: null };

      try {
        await supabase.from('transactions').insert({
          type: 'member_fee',
          amount: amount,
          member_id: memberProfile?.id || null,
          transaction_date: new Date().toISOString().split('T')[0],
          payment_method: 'nagad',
          payment_reference: trxId.trim().toUpperCase(),
          description_bn: `নগদ অনলাইন পেমেন্ট (${invoiceNo}) - প্রেরক: ${senderAccount}`,
          description_en: `Nagad Online Payment (${invoiceNo}) - Sender: ${senderAccount}`,
        });
      } catch (txErr) {
        console.warn('Transaction record warning:', txErr);
      }

      setPhase('success');
      onSuccess(trxId.trim().toUpperCase(), {
        method: 'nagad',
        sender: senderAccount,
        amount,
        invoiceNo,
      });

      toast({
        title: 'পেমেন্ট ভেরিফিকেশন জমা হয়েছে!',
        description: `TrxID: ${trxId.trim().toUpperCase()}`,
      });
    } catch (err: any) {
      toast({
        title: 'ত্রুটি',
        description: err.message || 'পেমেন্ট জমা দেওয়া যায়নি',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto bg-gradient-to-b from-[#B8191F] via-[#9E141A] to-[#6E0B10] rounded-3xl shadow-2xl text-white overflow-hidden font-sans relative border-4 border-[#3a0609] animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Language Toggle Pill (Exact layout of Reference Image 4) */}
      <div className="pt-4 px-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          title="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center rounded-lg border border-white/40 overflow-hidden text-xs font-bold shadow-sm">
          <button
            type="button"
            onClick={() => setLang('bn')}
            className={`px-2.5 py-1 transition-colors ${lang === 'bn' ? 'bg-white text-[#9E141A]' : 'bg-transparent text-white'}`}
          >
            বাং
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 transition-colors ${lang === 'en' ? 'bg-white text-[#9E141A]' : 'bg-transparent text-white'}`}
          >
            Eng
          </button>
        </div>
      </div>

      {/* Cart / Merchant Header Icon (Exact layout of Image 4) */}
      <div className="pt-3 pb-2 text-center space-y-1">
        <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto flex items-center justify-center border border-white/20 shadow-inner">
          <img
            src={logoUrl || '/logo.png'}
            alt="সময়ের বাতিঘর"
            className="w-12 h-12 object-contain"
          />
        </div>
        <h3 className="font-extrabold text-lg sm:text-xl tracking-tight text-white drop-shadow-sm">
          সময়ের বাতিঘর
        </h3>
        <p className="text-[11px] text-white/80 font-medium">
          {lang === 'bn' ? 'একটি সামাজিক স্বেচ্ছাসেবী সংগঠন' : 'Social Welfare Organization'}
        </p>
      </div>

      {/* Invoice Details Block (Exact layout of Image 4) */}
      <div className="px-6 py-3 space-y-1.5 text-xs sm:text-sm font-semibold text-white/95 border-y border-white/10 bg-black/10">
        <div className="flex justify-between items-center">
          <span className="text-white/80">Invoice No:</span>
          <span className="font-mono font-bold tracking-wider">{invoiceNo}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/80">Total Amount:</span>
          <span className="font-bold text-base text-yellow-300">BDT {amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/80">Charge:</span>
          <span className="font-bold">BDT 0</span>
        </div>
      </div>

      {/* ================= PHASE 1: ACCOUNT NUMBER INPUT (Image 4) ================= */}
      {phase === 'account' && (
        <div className="p-6 space-y-5 text-center">
          <div>
            <h4 className="font-bold text-sm sm:text-base text-white tracking-wide">
              {lang === 'bn' ? 'আপনার নগদ একাউন্ট নম্বর দিন' : 'Your Nagad Account Number'}
            </h4>

            {/* Segmented / Formatted Account Input Box */}
            <div className="mt-3 max-w-xs mx-auto">
              <input
                type="tel"
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={14}
                className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 font-mono text-center text-lg font-black tracking-widest outline-none placeholder:text-slate-400 shadow-lg"
                autoFocus
              />
            </div>

            <p className="text-[10px] sm:text-[11px] text-white/80 leading-relaxed max-w-xs mx-auto pt-3">
              By clicking/tapping "Proceed" you are agreeing to our{' '}
              <span className="underline font-bold cursor-pointer">Terms and Conditions</span>
            </p>
          </div>

          {/* White Pill Action Buttons: Proceed & Close */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleProceed}
              className="px-6 sm:px-8 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#9E141A] font-extrabold text-sm shadow-md transition-transform active:scale-95"
            >
              Proceed
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 sm:px-8 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#9E141A] font-extrabold text-sm shadow-md transition-transform active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ================= PHASE 2: SEND MONEY & TRXID VERIFICATION ================= */}
      {phase === 'verify' && (
        <div className="p-5 space-y-4">
          {/* Preset Recipient Number */}
          <div className="p-3.5 rounded-2xl bg-black/25 border border-white/20 text-center space-y-1">
            <p className="text-xs text-white/80 font-medium">
              অনুগ্রহ করে নিচের নগদ নম্বরে Send Money করুন
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="font-mono text-xl sm:text-2xl font-black text-yellow-300 tracking-wider">
                {recipientNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে' : 'COPY'}</span>
              </button>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="bg-black/30 rounded-2xl p-3 text-center border border-white/10">
            <p className="text-[11px] text-white/80">পেমেন্ট সম্পন্ন করার বাকি সময়</p>
            <p className="font-mono text-2xl font-black text-yellow-400 tracking-widest mt-0.5">
              {formatTimer(secondsLeft)}
            </p>
          </div>

          {/* TrxID Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-white/90 block text-center">
              নগদ ট্রানজেকশন আইডি (TrxID)
            </label>
            <input
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              placeholder="e.g. 7X89BKL2"
              className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 text-center font-mono font-black text-sm tracking-widest uppercase outline-none shadow-md"
            />
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleVerifyTrxId}
            disabled={isVerifying}
            className="w-full py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#9E141A] font-black text-sm uppercase tracking-wide shadow-lg transition-transform active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#9E141A]" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <span>পেমেন্ট নিশ্চিত করুন (SUBMIT)</span>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setPhase('account')}
              className="text-xs text-white/70 hover:text-white underline font-semibold"
            >
              ← একাউন্ট পরিবর্তন করুন
            </button>
          </div>
        </div>
      )}

      {/* ================= PHASE 3: SUCCESS CONFIRMATION ================= */}
      {phase === 'success' && (
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/20 text-yellow-300 mx-auto flex items-center justify-center shadow-lg border border-white/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">নগদ পেমেন্ট সফলভাবে গৃহীত!</h3>
            <p className="text-xs text-white/80 mt-1">
              TrxID: <span className="font-mono font-bold text-yellow-300">{trxId}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/20 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-white/70">পরিমাণ:</span>
              <span className="font-bold text-yellow-300">BDT {amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">ইনভয়েস:</span>
              <span className="font-mono text-white">{invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">স্ট্যাটাস:</span>
              <span className="font-bold text-yellow-300">যাচাইয়ের জন্য অপেক্ষমাণ</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white text-[#9E141A] font-extrabold text-sm hover:bg-slate-100 transition-colors shadow-md"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Official Nagad Bottom Branding (Exact signature of Reference Image 4) */}
      <div className="pb-5 pt-3 text-center flex flex-col items-center justify-center gap-1 border-t border-white/10 bg-black/15">
        <div className="flex items-center gap-2">
          <NagadLogo className="w-7 h-7" />
          <span className="font-heading font-black text-xl tracking-tight text-white">
            নগদ
          </span>
        </div>
        <p className="text-[10px] text-white/70 tracking-widest font-medium">
          ডাক বিভাগের ডিজিটাল লেনদেন
        </p>
      </div>

    </div>
  );
};

export default NagadPaymentView;

