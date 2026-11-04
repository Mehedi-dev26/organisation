import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BkashLogo } from './PaymentLogos';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateTransactionId } from '@/lib/trxValidation';
import { 
  X, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  RotateCcw,
  Loader2,
  Smartphone,
  Home,
  Receipt,
  Sparkles
} from 'lucide-react';

interface BkashPaymentViewProps {
  amount: number;
  invoiceNo: string;
  recipientNumber?: string;
  dueId?: string | null;
  purpose?: string;
  customLogoUrl?: string | null;
  instructions?: string | null;
  onClose: () => void;
  onSuccess: (trxId: string, details: any) => void;
}

export const BkashPaymentView: React.FC<BkashPaymentViewProps> = ({
  amount,
  invoiceNo,
  recipientNumber = '01616355160',
  dueId,
  purpose = 'সময়ের বাতিঘর চাঁদা ও অনুদান',
  customLogoUrl,
  instructions,
  onClose,
  onSuccess,
}) => {
  const { logoUrl } = useSiteLogo();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Phase: 'account' (Image 2) or 'verify' (Image 3) or 'success'
  const [phase, setPhase] = useState<'account' | 'verify' | 'success'>('account');
  const [senderAccount, setSenderAccount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // 02:44 (164 seconds) countdown timer as shown in Reference Image 3
  const [secondsLeft, setSecondsLeft] = useState(164);

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

  const handleProceedFromAccount = () => {
    const clean = senderAccount.replace(/\D/g, '');
    if (clean.length < 11) {
      toast({
        title: 'ভুল মোবাইল নম্বর',
        description: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বিকাশ নম্বর দিন',
        variant: 'destructive',
      });
      return;
    }
    setPhase('verify');
  };

  const handleVerifyTrxId = async () => {
    const validation = validateTransactionId('bkash', trxId);
    if (!validation.isValid) {
      toast({
        title: 'ভুল ট্রানজেকশন আইডি',
        description: validation.message || 'অনুগ্রহ করে সঠিক বিকাশ ট্রানজেকশন আইডি দিন',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);

    try {
      const cleanTrx = trxId.trim().toUpperCase();
      const { data: memberProfile } = user?.id 
        ? await supabase.from('members').select('id, full_name, member_id').eq('user_id', user.id).maybeSingle()
        : { data: null };

      // 1. Link or record into member_dues so it immediately appears in Admin Payment Verification
      let targetDueId = dueId;
      if (!targetDueId && memberProfile?.id) {
        const { data: firstUnpaid } = await supabase
          .from('member_dues')
          .select('id')
          .eq('member_id', memberProfile.id)
          .eq('is_paid', false)
          .neq('payment_status', 'submitted')
          .limit(1)
          .maybeSingle();

        if (firstUnpaid) {
          targetDueId = firstUnpaid.id;
        }
      }

      if (targetDueId) {
        await supabase
          .from('member_dues')
          .update({
            transaction_id: cleanTrx,
            payment_method: 'bkash',
            payment_status: 'submitted',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', targetDueId);
      } else if (memberProfile?.id) {
        const now = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonthYear = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        await supabase.from('member_dues').insert({
          member_id: memberProfile.id,
          month_year: currentMonthYear,
          amount: amount,
          payment_method: 'bkash',
          transaction_id: cleanTrx,
          payment_status: 'submitted',
          submitted_at: now.toISOString(),
          is_paid: false,
        });
      }

      try {
        await supabase.from('transactions').insert({
          type: 'member_fee',
          amount: amount,
          member_id: memberProfile?.id || null,
          transaction_date: new Date().toISOString().split('T')[0],
          payment_method: 'bkash',
          payment_reference: trxId.trim().toUpperCase(),
          description_bn: `বিকাশ অনলাইন পেমেন্ট (${invoiceNo}) - প্রেরক: ${senderAccount}`,
          description_en: `bKash Online Payment (${invoiceNo}) - Sender: ${senderAccount}`,
        });
      } catch (txErr) {
        console.warn('Transaction record warning:', txErr);
      }

      setPhase('success');
      onSuccess(trxId.trim().toUpperCase(), {
        method: 'bkash',
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
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden font-sans relative animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Header with Centered Large bKash Logo and Top-Right Close Button */}
      <div className="relative px-5 pt-4 pb-3.5 border-b border-slate-100 flex flex-col items-center justify-center bg-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-4 text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer z-10"
          title="বন্ধ করুন"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Centered Large Official bKash Logo */}
        <div className="flex items-center justify-center min-h-[52px]">
          {customLogoUrl ? (
            <img 
              src={customLogoUrl} 
              alt="bKash" 
              className="h-12 sm:h-14 max-w-[220px] object-contain drop-shadow-xs" 
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <BkashLogo className="w-10 h-10 drop-shadow-xs" />
              <span className="font-extrabold text-2xl sm:text-3xl text-[#E2136E] tracking-tight">bKash</span>
            </div>
          )}
        </div>
      </div>

      {/* Merchant Info Bar (Exact layout of Image 2 & 3) */}
      <div className="px-5 py-3 flex items-center justify-between bg-slate-50/70 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <img
            src={logoUrl || '/logo.png'}
            alt="সময়ের বাতিঘর"
            className="w-10 h-10 rounded-full border border-slate-200 object-contain bg-white p-0.5"
          />
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">
              সময়ের বাতিঘর (অফিসিয়াল)
            </h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Inv No: {invoiceNo}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-base sm:text-lg text-slate-900">
            ৳{amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ================= PHASE 1: ACCOUNT NUMBER INPUT (Image 2) ================= */}
      {phase === 'account' && (
        <div>
          {/* Signature Hot Pink Box (#E2136E) */}
          <div className="bg-[#E2136E] px-6 py-8 text-white text-center space-y-4">
            <h3 className="font-bold text-base sm:text-lg tracking-wide">
              আপনার Bkash অ্যাকাউন্ট নম্বর দিন
            </h3>

            <div className="max-w-xs mx-auto">
              <input
                type="tel"
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                placeholder="e.g 01XXXXXXXXX"
                maxLength={14}
                className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 font-mono text-center text-lg font-bold tracking-wider outline-none placeholder:text-slate-400 shadow-inner"
                autoFocus
              />
            </div>

            <p className="text-[10px] sm:text-[11px] text-white/90 leading-tight max-w-xs mx-auto pt-1">
              By clicking/tapping "Proceed" you are agreeing to our{' '}
              <span className="underline cursor-pointer font-bold">Terms and Conditions</span>
            </p>
          </div>

          {/* Action Buttons: CLOSE & PROCEED */}
          <div className="p-4 grid grid-cols-2 gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-extrabold text-sm uppercase transition-colors"
            >
              CLOSE
            </button>
            <button
              type="button"
              onClick={handleProceedFromAccount}
              className="w-full py-3 rounded-xl bg-slate-300 hover:bg-[#E2136E] text-slate-700 hover:text-white font-extrabold text-sm uppercase transition-all shadow-sm"
            >
              PROCEED
            </button>
          </div>

          {/* Footer note */}
          <div className="pb-4 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Secured by সময়ের বাতিঘর পেমেন্ট সিস্টেম
            </p>
          </div>
        </div>
      )}

      {/* ================= PHASE 2: SEND MONEY & TRXID VERIFICATION (Image 3) ================= */}
      {phase === 'verify' && (
        <div className="p-4 sm:p-5 space-y-3.5">
          
          {/* Recipient Number Box with 1-Click Copy */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-1">
            <p className="text-xs font-semibold text-slate-500">
              অনুগ্রহ করে নিচের নম্বরে সেন্ড মানি করুন
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="font-mono text-xl sm:text-2xl font-black text-[#E2136E] tracking-wider">
                {recipientNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে' : 'COPY'}</span>
              </button>
            </div>
          </div>

          {/* Hot Pink Countdown Timer Box */}
          <div className="bg-[#E2136E] rounded-2xl p-3.5 text-white text-center space-y-1 shadow-sm">
            <p className="text-xs font-medium text-white/90">
              পেমেন্ট সম্পন্ন করার জন্য সময় বাকি
            </p>
            <p className="font-mono text-3xl font-black tracking-widest">
              {formatTimer(secondsLeft)}
            </p>
          </div>

          {/* bKash Send Money Graphic Illustration (Exact from Image 3) */}
          <div className="rounded-2xl border border-pink-200/90 bg-white overflow-hidden shadow-xs">
            {/* Top mini-bar of bKash app */}
            <div className="bg-gradient-to-r from-[#D81B60] via-[#E2136E] to-[#C2185B] px-3.5 py-2 flex items-center justify-between text-white text-[10px]">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="px-1.5 py-0.5 rounded bg-white/20 font-black text-[9px]">dP</span>
                <span className="bg-white/25 px-2 py-0.5 rounded-full font-mono font-bold text-[9px]">৳ 231.33</span>
              </div>
              <div className="flex items-center gap-2 opacity-90 text-[10px]">
                <span className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center text-[9px]">🔍</span>
                <span className="w-4 h-4 border border-white/60 rounded flex items-center justify-center text-[9px]">⊡</span>
              </div>
            </div>

            {/* 4 App Grid Icons */}
            <div className="p-3 grid grid-cols-4 gap-2 text-center bg-pink-50/40">
              {/* Send Money - Highlighted with arrow indicator */}
              <div className="relative flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-pink-100 border-2 border-[#E2136E] flex items-center justify-center text-[#E2136E] shadow-xs">
                  <Smartphone className="w-4 h-4 text-[#E2136E]" />
                </div>
                <span className="text-[9px] font-extrabold text-[#E2136E] mt-1 leading-tight">Send Money</span>
                {/* Red Pointer Arrow from Image 3 */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center text-red-600 font-black text-xs animate-bounce">
                  ↗
                </span>
              </div>

              <div className="flex flex-col items-center opacity-60">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-slate-600 mt-1 leading-tight">Mobile Recharge</span>
              </div>

              <div className="flex flex-col items-center opacity-60">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-slate-600 mt-1 leading-tight">Cash Out</span>
              </div>

              <div className="flex flex-col items-center opacity-60">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-slate-600 mt-1 leading-tight">Payment</span>
              </div>
            </div>
          </div>

          {/* Real-Time Database Instructions or Default Steps */}
          {instructions && instructions.trim() ? (
            <div className="space-y-1.5 text-xs text-slate-700 font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed">
              {instructions.split('\n').filter(Boolean).map((line, idx) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#E2136E] font-bold shrink-0">{line.match(/^[০-৯\d]+[\.\)]/)?.[0] || '•'}</span>
                  <span>{line.replace(/^[০-৯\d]+[\.\)]\s*/, '')}</span>
                </p>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-xs text-slate-700 font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p className="flex items-start gap-1.5">
                <span className="text-[#E2136E] font-bold">১.</span>
                <span>আপনার Bkash অ্যাপ অথবা ইউএসএসডি (*২৪৭#) ব্যবহার করুন।</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="text-[#E2136E] font-bold">২.</span>
                <span><strong>Send Money</strong> করে উপরের নম্বরে ৳{amount.toFixed(2)} টাকা পাঠান।</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="text-[#E2136E] font-bold">৩.</span>
                <span>টাকা পাঠানোর পর প্রাপ্ত Transaction ID (TrxID) নিচে প্রদান করুন।</span>
              </p>
            </div>
          )}

          {/* Live Checker Status */}
          <div className="text-center pt-1">
            <p className="text-xs font-bold text-[#E2136E] animate-pulse">
              পেমেন্ট চেক করা হচ্ছে, অপেক্ষা করুন...
            </p>
          </div>

          {/* Try Again Button */}
          <button
            type="button"
            onClick={() => setSecondsLeft(164)}
            className="w-full py-2.5 rounded-xl bg-[#E2136E] hover:bg-[#c90f61] text-white font-extrabold text-xs uppercase tracking-wide shadow-sm transition-colors"
          >
            পেমেন্ট চেক করুন (TRY AGAIN)
          </button>

          {/* TrxID Input Field */}
          <div className="space-y-1.5 pt-1">
            <input
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              placeholder="ENTER TRANSACTION ID"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-center font-mono font-bold text-sm tracking-widest uppercase outline-none focus:border-[#E2136E]"
            />
          </div>

          {/* Verify with Trx ID Button (Dark Slate Button matching Image 3) */}
          <button
            type="button"
            onClick={handleVerifyTrxId}
            disabled={isVerifying}
            className="w-full py-3.5 rounded-xl bg-[#28323E] hover:bg-[#1E252E] text-white font-extrabold text-xs uppercase tracking-widest shadow-md transition-colors disabled:opacity-75 flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <span>VERIFY WITH TRX ID</span>
            )}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setPhase('account')}
              className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold"
            >
              ← অ্যাকাউন্ট পরিবর্তন করুন
            </button>
          </div>
        </div>
      )}

      {/* ================= PHASE 3: ADVANCED SUCCESS & THANK YOU SCREEN ================= */}
      {phase === 'success' && (
        <div className="p-6 sm:p-8 text-center space-y-5 bg-gradient-to-b from-emerald-50/50 via-white to-white">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg ring-8 ring-emerald-50">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wide">
              পেমেন্ট রিকোয়েস্ট সফল
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              আপনাকে আন্তরিক ধন্যবাদ!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              আপনার চাঁদা পরিশোধের তথ্যটি সফলভাবে সিস্টেমে জমা হয়েছে। আমাদের অ্যাডমিন/ক্যাশিয়ার রিভিউ করার পর আপনার চাঁদা ভেরিফাই সম্পন্ন হবে এবং আপনাকে মেসেজ পাঠিয়ে জানিয়ে দেওয়া হবে।
            </p>
          </div>

          {/* Payment Receipt Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-left space-y-2.5 shadow-2xs">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">চাঁদার পরিমাণ:</span>
              <span className="text-lg font-black text-emerald-700 font-mono">৳{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ট্রানজেকশন আইডি (TrxID):</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {trxId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ইনভয়েস নম্বর:</span>
              <span className="font-mono text-slate-700">{invoiceNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">পেমেন্ট মেথড:</span>
              <span className="font-bold text-[#E2136E]">বিকাশ (bKash)</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">বর্তমান স্ট্যাটাস:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800">
                <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                <span>যাচাই ও রিভিউ অপেক্ষমাণ</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => navigate('/member')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0B6B3A] hover:bg-[#09542e] text-white font-black text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>ড্যাশবোর্ডে ফিরে যান</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/member/dues')}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-700" />
              <span>চাঁদা বিবরণ ও রসিদ তালিকা দেখুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BkashPaymentView;

