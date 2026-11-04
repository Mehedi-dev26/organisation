import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateTransactionId } from '@/lib/trxValidation';
import { 
  X, 
  Copy, 
  Check, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  Smartphone,
  Home,
  Receipt,
  Sparkles,
  Clock
} from 'lucide-react';
import { 
  RocketLogo, 
  UpayLogo, 
  CellfinLogo, 
  TapLogo 
} from './PaymentLogos';

import { markMagicLinkUsed } from '@/lib/magicLinkUtils';

interface GenericMobilePaymentViewProps {
  methodId: 'rocket' | 'upay' | 'cellfin' | 'tap';
  methodName: string;
  amount: number;
  invoiceNo: string;
  recipientNumber?: string;
  dueId?: string | null;
  purpose?: string;
  customLogoUrl?: string | null;
  instructions?: string | null;
  magicMember?: { id: string; full_name: string; member_id: string; phone?: string } | null;
  magicToken?: string | null;
  onClose: () => void;
  onSuccess: (trxId: string, details: any) => void;
}

const METHOD_THEMES = {
  rocket: {
    name: 'Rocket',
    nameBn: 'রকেট',
    headerBg: 'bg-gradient-to-r from-purple-700 to-fuchsia-800',
    accentColor: '#8C3494',
    logo: <RocketLogo className="w-7 h-7" />,
    instructions: 'রকেট অ্যাপ বা *৩২২# ডায়াল করে Send Money করুন।',
  },
  upay: {
    name: 'Upay',
    nameBn: 'উপায়',
    headerBg: 'bg-gradient-to-r from-[#002D62] to-[#0A4B94]',
    accentColor: '#002D62',
    logo: <UpayLogo className="w-7 h-7" />,
    instructions: 'Upay অ্যাপ অথবা *২৬৮# ডায়াল করে Send Money করুন।',
  },
  cellfin: {
    name: 'Cellfin',
    nameBn: 'সেলফিন',
    headerBg: 'bg-gradient-to-r from-[#00843D] to-[#005A2B]',
    accentColor: '#00843D',
    logo: <CellfinLogo className="w-7 h-7" />,
    instructions: 'ইসলামী ব্যাংকের Cellfin অ্যাপে প্রবেশ করে ফান্ড ট্রান্সফার করুন।',
  },
  tap: {
    name: 'Tap',
    nameBn: 'ট্যাপ পে',
    headerBg: 'bg-gradient-to-r from-[#E31E24] to-[#B31419]',
    accentColor: '#E31E24',
    logo: <TapLogo className="w-7 h-7" />,
    instructions: 'ট্যাপ অ্যাপ অথবা ট্রাস্ট ব্যাংক একাউন্ট থেকে পেমেন্ট করুন।',
  },
};

export const GenericMobilePaymentView: React.FC<GenericMobilePaymentViewProps> = ({
  methodId,
  methodName,
  amount,
  invoiceNo,
  recipientNumber = '01616355160',
  dueId,
  purpose = 'সময়ের বাতিঘর চাঁদা ও অনুদান',
  customLogoUrl,
  instructions,
  magicMember,
  magicToken,
  onClose,
  onSuccess,
}) => {
  const { logoUrl } = useSiteLogo();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const theme = METHOD_THEMES[methodId] || METHOD_THEMES.rocket;

  const [phase, setPhase] = useState<'account' | 'verify' | 'success'>('account');
  const [senderAccount, setSenderAccount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(180);

  useEffect(() => {
    if (phase !== 'verify') return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recipientNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast({ title: 'নম্বর কপি হয়েছে!', description: recipientNumber });
  };

  const handleProceed = () => {
    const clean = senderAccount.replace(/\D/g, '');
    if (clean.length < 10) {
      toast({
        title: 'ভুল একাউন্ট নম্বর',
        description: 'সঠিক একাউন্ট বা মোবাইল নম্বর প্রদান করুন',
        variant: 'destructive',
      });
      return;
    }
    setPhase('verify');
  };

  const handleVerifyTrxId = async () => {
    const validation = validateTransactionId(methodId, trxId);
    if (!validation.isValid) {
      toast({
        title: 'ভুল ট্রানজেকশন আইডি',
        description: validation.message || 'সঠিক ট্রানজেকশন আইডি প্রদান করুন',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);

    try {
      const cleanTrx = trxId.trim().toUpperCase();
      let memberProfile: { id: string; full_name: string; member_id: string } | null = null;
      if (user?.id) {
        const { data } = await supabase.from('members').select('id, full_name, member_id').eq('user_id', user.id).maybeSingle();
        memberProfile = data;
      } else if (magicMember?.id) {
        memberProfile = magicMember;
      }

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
            payment_method: methodId,
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
          payment_method: methodId,
          transaction_id: cleanTrx,
          payment_status: 'submitted',
          submitted_at: now.toISOString(),
          is_paid: false,
        });
      }

      // Mark magic link as used if paid via magic link
      if (magicToken) {
        try {
          await markMagicLinkUsed(magicToken, cleanTrx, methodId);
        } catch (mErr) {
          console.warn('Mark magic link error:', mErr);
        }
      }

      try {
        await supabase.from('transactions').insert({
          type: 'member_fee',
          amount: amount,
          member_id: memberProfile?.id || null,
          transaction_date: new Date().toISOString().split('T')[0],
          payment_method: methodId,
          payment_reference: trxId.trim().toUpperCase(),
          description_bn: `${theme.nameBn} পেমেন্ট (${invoiceNo}) - প্রেরক: ${senderAccount}`,
          description_en: `${theme.name} Payment (${invoiceNo}) - Sender: ${senderAccount}`,
        });
      } catch (txErr) {
        console.warn('Transaction warning:', txErr);
      }

      setPhase('success');
      onSuccess(trxId.trim().toUpperCase(), {
        method: methodId,
        sender: senderAccount,
        amount,
        invoiceNo,
      });

      toast({
        title: 'পেমেন্ট জমা হয়েছে!',
        description: `TrxID: ${trxId.trim().toUpperCase()}`,
      });
    } catch (err: any) {
      toast({
        title: 'ত্রুটি',
        description: err.message || 'পেমেন্ট সাবমিট করা যায়নি',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden font-sans relative animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header with Centered Large Gateway Logo and Top-Right Close Button */}
      <div className={`relative px-5 pt-4 pb-4 text-white flex flex-col items-center justify-center text-center ${theme.headerBg}`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer z-10"
          title="বন্ধ করুন"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Centered Large Brand Logo */}
        <div className="flex flex-col items-center justify-center gap-2">
          {customLogoUrl ? (
            <div className="h-14 sm:h-16 max-w-[210px] bg-white rounded-2xl p-2 flex items-center justify-center shadow-md">
              <img
                src={customLogoUrl}
                alt={theme.name}
                className="h-full w-auto max-w-[180px] object-contain"
              />
            </div>
          ) : (
            <div className="scale-125 my-1 drop-shadow-sm">
              {theme.logo}
            </div>
          )}
          <div>
            <h3 className="font-extrabold text-xl sm:text-2xl leading-tight tracking-tight">{theme.nameBn}</h3>
            <p className="text-[11px] text-white/90 font-medium">Secured Payment Gateway</p>
          </div>
        </div>
      </div>

      {/* Merchant / Invoice Bar */}
      <div className="px-5 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-100 text-xs">
        <div>
          <p className="font-bold text-slate-800">সময়ের বাতিঘর (অফিসিয়াল)</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Inv: {invoiceNo}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-base text-slate-900">৳{amount.toFixed(2)}</p>
        </div>
      </div>

      {/* Body */}
      {phase === 'account' && (
        <div className="p-6 space-y-4 text-center">
          <h4 className="font-bold text-sm text-slate-800">
            আপনার {theme.nameBn} একাউন্ট বা মোবাইল নম্বর দিন
          </h4>
          <input
            type="tel"
            value={senderAccount}
            onChange={(e) => setSenderAccount(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-center text-lg font-bold outline-none focus:border-slate-800"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase"
            >
              CLOSE
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase hover:bg-slate-800"
            >
              PROCEED
            </button>
          </div>
        </div>
      )}

      {phase === 'verify' && (
        <div className="p-5 space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="text-xs text-slate-500 font-medium">নিচের নম্বরে টাকা পাঠান (Send Money):</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="font-mono text-xl font-black text-slate-900">{recipientNumber}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold"
              >
                {copied ? 'কপি হয়েছে' : 'COPY'}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 text-white text-center">
            <p className="text-[11px] text-slate-300">বাকি সময়</p>
            <p className="font-mono text-2xl font-black text-amber-300">{formatTimer(secondsLeft)}</p>
          </div>

          {/* Real-time Instructions from Database or fallback */}
          {instructions && instructions.trim() ? (
            <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border leading-relaxed">
              {instructions.split('\n').filter(Boolean).map((line, idx) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <span className="font-bold shrink-0 text-slate-900">{line.match(/^[০-৯\d]+[\.\)]/)?.[0] || '•'}</span>
                  <span>{line.replace(/^[০-৯\d]+[\.\)]\s*/, '')}</span>
                </p>
              ))}
            </div>
          ) : (
            <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border">
              <p>💡 {theme.instructions}</p>
              <p>টাকা পাঠানোর পর প্রাপ্ত Transaction ID (TrxID) নিচে দিন।</p>
            </div>
          )}

          <input
            type="text"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value.toUpperCase())}
            placeholder="ENTER TRANSACTION ID"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono font-bold text-center uppercase outline-none"
          />

          <button
            type="button"
            onClick={handleVerifyTrxId}
            disabled={isVerifying}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase"
          >
            {isVerifying ? 'যাচাই করা হচ্ছে...' : 'VERIFY WITH TRX ID'}
          </button>
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
              আপনার {theme.nameBn} পেমেন্টের তথ্যটি সফলভাবে জমা হয়েছে। আমাদের অ্যাডমিন/ক্যাশিয়ার রিভিউ করার পর আপনার চাঁদা ভেরিফাই সম্পন্ন হবে এবং আপনাকে মেসেজ পাঠিয়ে জানিয়ে দেওয়া হবে।
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
              <span className="font-bold text-slate-800">{theme.nameBn}</span>
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

export default GenericMobilePaymentView;

