import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMember, DuesData } from '@/components/member/MemberContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  Printer, 
  AlertCircle, 
  Loader2, 
  ArrowUpRight, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Smartphone,
  Building2,
  Sparkles,
  Zap,
  HelpCircle
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import TransactionVoucher from '@/components/admin/TransactionVoucher';

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  payment_method: string;
  payment_reference?: string;
  transaction_date: string;
  category?: string;
  description_bn?: string;
  description_en?: string;
}

interface PaymentMethod {
  id: string;
  method_type: string;
  account_name: string;
  account_number: string;
  branch_name: string | null;
  routing_number: string | null;
  instructions_bn: string | null;
  instructions_en: string | null;
  is_active: boolean;
  sort_order: number;
}

const MemberDuesPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    memberData, 
    duesData, 
    duesLoading, 
    paidDues, 
    unpaidDues, 
    unpaidMonths, 
    monthlyFee, 
    yearlyTotal,
    refetchDues
  } = useMember();

  // Voucher print state
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printTransaction, setPrintTransaction] = useState<TransactionData | null>(null);
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  // Quick Pay Modal State
  const [isQuickPayOpen, setIsQuickPayOpen] = useState(false);
  const [quickPayDue, setQuickPayDue] = useState<DuesData | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [trxId, setTrxId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active payment methods for quick display & payment
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods-member'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as PaymentMethod[];
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: voucherRef,
    documentTitle: `Voucher-${printTransaction?.payment_reference || 'receipt'}`,
  });

  const handleViewVoucher = async (due: DuesData) => {
    if (!due.transaction_id) return;
    setIsLoadingTransaction(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', due.transaction_id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPrintTransaction(data as TransactionData);
        setIsPrintDialogOpen(true);
      }
    } catch (err) {
      console.error('Error fetching voucher transaction:', err);
    } finally {
      setIsLoadingTransaction(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: language === 'bn' ? 'কপি হয়েছে' : 'Copied',
      description: text,
    });
  };

  const openQuickPay = (due: DuesData) => {
    navigate(`/payment?dueId=${due.id}&amount=${due.amount}&purpose=${encodeURIComponent(`${due.month_year} মাসের সদস্য চাঁদা`)}`);
  };

  const handleSubmitQuickPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayDue) return;

    if (!selectedMethodId) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'একটি পেমেন্ট মেথড নির্বাচন করুন।' : 'Please select a payment method.',
        variant: 'destructive',
      });
      return;
    }

    if (!trxId.trim()) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID) লিখুন।' : 'Please enter Transaction ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('member_dues')
        .update({
          payment_status: 'submitted',
          payment_method: selectedMethodId,
          transaction_id: trxId.trim(),
          submitted_at: new Date().toISOString(),
        })
        .eq('id', quickPayDue.id);

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'পেমেন্ট জমা হয়েছে!' : 'Payment Submitted!',
        description: language === 'bn'
          ? 'আপনার পেমেন্ট তথ্য সফলভাবে জমা হয়েছে। অ্যাডমিন বা ক্যাশিয়ার যাচাই করে অনুমোদন করবেন।'
          : 'Payment information submitted successfully for verification.',
      });

      setIsQuickPayOpen(false);
      refetchDues();
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
    } catch (err: any) {
      toast({
        title: language === 'bn' ? 'জমা ব্যর্থ' : 'Submission Failed',
        description: err.message || 'Error submitting payment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMethodObj = paymentMethods.find((m) => m.method_type === selectedMethodId);
  const paidPercent = yearlyTotal > 0 ? Math.min(100, Math.round((paidDues / yearlyTotal) * 100)) : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Header (Signature Two-Tone Aesthetic) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
            <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'bn' ? 'চাঁদা ও পেমেন্ট পোর্টাল' : 'Dues & Fees Portal'}</span>
          </div>

          <div className="mt-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#14231B] font-heading tracking-tight leading-tight">
              {language === 'bn' ? 'মাসিক ও বার্ষিক চাঁদা ব্যবস্থাপনা' : 'Monthly Dues & Financial Records'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {language === 'bn' 
                ? 'আপনার সকল মাসের চাঁদার স্থিতি, বকেয়া পরিশোধ এবং ডিজিটাল পেমেন্ট ভাউচার' 
                : 'Manage your monthly dues, pay pending amounts, and download payment vouchers'}
            </p>
          </div>
        </div>

        <Link
          to="/member/pay-dues"
          className="rounded-xl px-5 py-2.5 font-black text-xs sm:text-sm bg-[#0B6B3A] hover:bg-[#09572E] text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>{language === 'bn' ? 'অনলাইন চাঁদা পরিশোধ' : 'Pay Online'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. Top 4 Activity Stat Cards (Admin/Dashboard polished design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: মোট পরিশোধিত */}
        <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#059669]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F4EA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <CheckCircle className="w-6 h-6 stroke-[2.2] text-[#059669]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'পরিশোধিত চাঁদা' : 'Total Paid'}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                ৳{paidDues.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#059669] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 2: বকেয়া চাঁদা */}
        <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className={`w-full h-full ${unpaidDues > 0 ? 'fill-[#EF4444]' : 'fill-[#10B981]'}`}>
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs ${
              unpaidDues > 0 ? 'bg-[#FEE2E2]' : 'bg-[#E6F4EA]'
            }`}>
              <Wallet className={`w-6 h-6 stroke-[2.2] ${unpaidDues > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'বকেয়া চাঁদা' : 'Unpaid Dues'}
              </p>
              <p className={`text-2xl sm:text-3xl font-black leading-tight mt-0.5 ${
                unpaidDues > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                ৳{unpaidDues.toLocaleString()}
              </p>
            </div>
          </div>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 shadow-2xs ${
            unpaidDues > 0 ? 'bg-[#FEE2E2] text-rose-600' : 'bg-[#E6F4EA] text-emerald-600'
          }`}>
            <span className="text-[10px] font-black">{unpaidMonths.length}</span>
          </div>
        </div>

        {/* Card 3: মাসিক চাঁদার হার */}
        <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#F59E0B]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Calendar className="w-6 h-6 stroke-[2.2] text-[#D97706]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'মাসিক চাঁদা হার' : 'Monthly Fee'}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                ৳{monthlyFee}
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <span className="text-[10px] font-black">মাস</span>
          </div>
        </div>

        {/* Card 4: এক বছরের মোট হিসাব */}
        <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#3B82F6]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <TrendingUp className="w-6 h-6 stroke-[2.2] text-[#2563EB]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? '১ বছরের চাঁদা' : '1 Year Total'}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                ৳{yearlyTotal}
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <span className="text-[10px] font-black">{paidPercent}%</span>
          </div>
        </div>
      </div>

      {/* 3. Dedicated Professional Pending Due & Payment Methods Banner */}
      {unpaidMonths.length > 0 ? (
        <div className="bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7]/40 to-[#FEE2E2]/30 border-2 border-amber-300 rounded-[26px] p-5 sm:p-6 shadow-[0_10px_35px_rgba(245,158,11,0.08)] relative overflow-hidden">
          {/* Subtle watermark / glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left Info: Unpaid months and details */}
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black shadow-xs animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn' ? `বকেয়া চাঁদা: ${unpaidMonths.length} মাস বাকি` : `${unpaidMonths.length} Month(s) Due`}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                {language === 'bn' 
                  ? `আপনার বকেয়া চাঁদার পরিমাণ ৳${unpaidDues.toLocaleString()}` 
                  : `Your Outstanding Due is ৳${unpaidDues.toLocaleString()}`}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {language === 'bn'
                  ? `বকেয়া মাসসমূহ: ${unpaidMonths.map(m => m.month_year).join(', ')}। সংগঠনের সমাজসেবা ও মানবিক কার্যক্রম সফল করতে অনুগ্রহ করে যেকোনো পেমেন্ট মেথডে আপনার চাঁদা পরিশোধ করুন।`
                  : `Pending months: ${unpaidMonths.map(m => m.month_year).join(', ')}. Please clear your due to support organization activities.`}
              </p>

              {/* Clear Dues Prompt */}
              <p className="text-xs text-slate-500 pt-1">
                {language === 'bn' 
                  ? 'নিচের বাটনে ক্লিক করে ডেডিকেটেড পেমেন্ট পেজে সরাসরি বিকাশ, নগদ বা রকেটের মাধ্যমে আপনার বকেয়া চাঁদা পরিশোধ করতে পারবেন।'
                  : 'Click below to pay your dues directly via bKash, Nagad or Rocket.'}
              </p>
            </div>

            {/* Right Buttons: Instant Pay Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto shrink-0">
              <Button
                type="button"
                onClick={() => openQuickPay(unpaidMonths[0])}
                className="w-full sm:w-auto rounded-xl px-6 py-3.5 font-black text-sm bg-[#0B6B3A] hover:bg-[#09572E] text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99]"
              >
                <CreditCard className="w-4 h-4" />
                <span>{language === 'bn' ? 'এখনই পরিশোধ করুন' : 'Pay Now'}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-[24px] p-5 sm:p-6 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                {language === 'bn' ? 'অভিনন্দন! আপনার কোনো চাঁদা বকেয়া নেই' : 'Great! You have no pending dues'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {language === 'bn' ? 'সংগঠনের প্রতি আপনার সহযোগিতার জন্য ধন্যবাদ।' : 'Thank you for your continuous support.'}
              </p>
            </div>
          </div>
          <Badge className="bg-[#0B6B3A] text-white border-0 font-bold px-3 py-1">
            {language === 'bn' ? 'ক্লিন স্ট্যাটাস' : 'Clean Status'}
          </Badge>
        </div>
      )}

      {/* 4. Monthly Dues Table */}
      <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F4EA] text-[#0B6B3A] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
              {language === 'bn' ? 'সকল মাসের চাঁদার বিবরণ ও রসিদ' : 'Monthly Dues Records & Receipts'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            {language === 'bn' ? `মোট: ${duesData.length}টি রেকর্ড` : `Total: ${duesData.length} records`}
          </span>
        </div>

        <CardContent className="p-0">
          {duesLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#0B6B3A]" />
            </div>
          ) : duesData.length > 0 ? (
            <>
              {/* Desktop Table View (Hidden on Mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70 border-slate-100">
                      <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'মাস ও বছর' : 'Month & Year'}</TableHead>
                      <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'চাঁদার পরিমাণ' : 'Amount'}</TableHead>
                      <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'পরিশোধ স্ট্যাটাস' : 'Status'}</TableHead>
                      <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'ট্রানজেকশন / তারিখ' : 'TrxID / Date'}</TableHead>
                      <TableHead className="text-right font-bold text-slate-600 text-xs">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duesData.map((due) => {
                      const isSubmitted = !due.is_paid && due.payment_status === 'submitted';
                      const isRejected = !due.is_paid && due.payment_status === 'rejected';
                      const isUnpaid = !due.is_paid && !isSubmitted;

                      return (
                        <TableRow key={due.id} className="hover:bg-slate-50/60 border-slate-100">
                          <TableCell className="font-bold text-slate-900 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-600" />
                              <span>{due.month_year}</span>
                            </div>
                          </TableCell>

                          <TableCell className="font-black text-slate-800 text-sm">
                            ৳{due.amount}
                          </TableCell>

                          <TableCell>
                            {due.is_paid ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                              </Badge>
                            ) : isSubmitted ? (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-[11px] font-bold animate-pulse">
                                <Clock className="w-3 h-3 mr-1" />
                                {language === 'bn' ? 'যাচাই অপেক্ষমাণ' : 'Pending Review'}
                              </Badge>
                            ) : isRejected ? (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-300 text-[11px] font-bold">
                                {language === 'bn' ? 'বাতিল' : 'Rejected'}
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-bold">
                                {language === 'bn' ? 'বকেয়া' : 'Unpaid'}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600">
                            {due.paid_date ? (
                              <span className="font-medium">{due.paid_date}</span>
                            ) : due.transaction_id ? (
                              <span className="font-mono text-emerald-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                                Trx: {due.transaction_id}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            {due.is_paid && due.transaction_id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-lg text-[#0B6B3A] hover:bg-[#E6F4EA] gap-1.5 text-xs font-bold"
                                onClick={() => handleViewVoucher(due)}
                                disabled={isLoadingTransaction}
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>{language === 'bn' ? 'রসিদ দেখুন' : 'Receipt'}</span>
                              </Button>
                            ) : isUnpaid ? (
                              <Button
                                size="sm"
                                className="rounded-lg bg-[#0B6B3A] hover:bg-[#09572E] text-white gap-1 text-xs font-bold shadow-xs"
                                onClick={() => openQuickPay(due)}
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>{language === 'bn' ? 'পরিশোধ করুন' : 'Pay Now'}</span>
                              </Button>
                            ) : isSubmitted ? (
                              <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded-md">
                                অপেক্ষমাণ
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold"
                                onClick={() => openQuickPay(due)}
                              >
                                {language === 'bn' ? 'পুনরায় চেষ্টা' : 'Retry'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile-Optimized Card Stack (Zero Horizontal Scroll!) */}
              <div className="block md:hidden divide-y divide-slate-100 p-2.5 sm:p-3 space-y-2.5">
                {duesData.map((due) => {
                  const isSubmitted = !due.is_paid && due.payment_status === 'submitted';
                  const isRejected = !due.is_paid && due.payment_status === 'rejected';
                  const isUnpaid = !due.is_paid && !isSubmitted;

                  return (
                    <div
                      key={due.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5"
                    >
                      {/* Top: Month & Amount */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">
                              {due.month_year}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">মাসিক চাঁদা</p>
                          </div>
                        </div>

                        <span className="text-base font-black text-slate-900 font-mono">
                          ৳{due.amount}
                        </span>
                      </div>

                      {/* Middle: Status & Trx/Date */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <div>
                          {due.is_paid ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                            </Badge>
                          ) : isSubmitted ? (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] font-bold animate-pulse">
                              <Clock className="w-3 h-3 mr-1" />
                              {language === 'bn' ? 'যাচাই অপেক্ষমাণ' : 'Pending'}
                            </Badge>
                          ) : isRejected ? (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-bold">
                              {language === 'bn' ? 'বাতিল' : 'Rejected'}
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                              {language === 'bn' ? 'বকেয়া' : 'Unpaid'}
                            </Badge>
                          )}
                        </div>

                        <div className="text-right">
                          {due.paid_date ? (
                            <span className="text-[11px] text-slate-500 font-medium">{due.paid_date}</span>
                          ) : due.transaction_id ? (
                            <span className="font-mono text-[11px] text-emerald-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                              Trx: {due.transaction_id}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action Button */}
                      <div className="pt-1">
                        {due.is_paid && due.transaction_id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-xl text-[#0B6B3A] border-emerald-300 hover:bg-[#E6F4EA] gap-1.5 text-xs font-bold h-9"
                            onClick={() => handleViewVoucher(due)}
                            disabled={isLoadingTransaction}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'রসিদ প্রিন্ট ও ডাউনলোড' : 'View Receipt'}</span>
                          </Button>
                        ) : isUnpaid ? (
                          <Button
                            size="sm"
                            className="w-full rounded-xl bg-[#0B6B3A] hover:bg-[#09572E] text-white gap-1.5 text-xs font-bold shadow-xs h-9 cursor-pointer"
                            onClick={() => openQuickPay(due)}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'এখনই পরিশোধ করুন' : 'Pay Now'}</span>
                          </Button>
                        ) : isSubmitted ? (
                          <div className="w-full py-1.5 rounded-xl bg-amber-50 text-amber-800 text-center text-xs font-bold border border-amber-200">
                            পেমেন্ট যাচাইয়ের অপেক্ষায় রয়েছে
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold h-9"
                            onClick={() => openQuickPay(due)}
                          >
                            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <CreditCard className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-2" />
              <p className="text-sm font-medium">
                {language === 'bn' ? 'কোনো চাঁদার রেকর্ড পাওয়া যায়নি' : 'No dues records found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Direct Quick Pay Dialog */}
      <Dialog open={isQuickPayOpen} onOpenChange={setIsQuickPayOpen}>
        <DialogContent className="max-w-lg rounded-[24px] p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading font-black text-lg text-slate-900">
              <CreditCard className="w-5 h-5 text-[#0B6B3A]" />
              <span>
                {language === 'bn' 
                  ? `${quickPayDue?.month_year || ''} মাসের চাঁদা পরিশোধ` 
                  : `Pay Dues for ${quickPayDue?.month_year || ''}`}
              </span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitQuickPay} className="space-y-4 pt-2">
            {/* Amount Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-800 font-bold">নির্ধারিত চাঁদার পরিমাণ</p>
                <p className="text-2xl font-black text-[#0B6B3A]">৳{quickPayDue?.amount || monthlyFee}</p>
              </div>
              <Badge className="bg-[#0B6B3A] text-white font-bold">
                {quickPayDue?.month_year}
              </Badge>
            </div>

            {/* Select Payment Method */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">
                পেমেন্ট মেথড নির্বাচন করুন
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedMethodId(pm.method_type)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedMethodId === pm.method_type
                        ? 'border-[#0B6B3A] bg-emerald-50/60 ring-2 ring-[#0B6B3A]/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-xs capitalize text-slate-900">{pm.method_type}</p>
                    <p className="font-mono text-[11px] text-slate-500 truncate">{pm.account_number}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Method Details with 1-click Copy */}
            {selectedMethodObj && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">অ্যাকাউন্ট নাম:</span>
                  <span className="font-bold text-slate-800">{selectedMethodObj.account_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">অ্যাকাউন্ট নম্বর:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#0B6B3A] text-sm">
                      {selectedMethodObj.account_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMethodObj.account_number, selectedMethodObj.id)}
                      className="p-1 rounded bg-white hover:bg-slate-200 text-slate-600 transition-colors"
                      title="কপি করুন"
                    >
                      {copiedId === selectedMethodObj.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                {selectedMethodObj.instructions_bn && (
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    {selectedMethodObj.instructions_bn}
                  </p>
                )}
              </div>
            )}

            {/* TrxID Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                ট্রানজেকশন আইডি (TrxID) *
              </Label>
              <Input
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="যেমন: BLK98765432"
                className="rounded-xl border-slate-200 font-mono uppercase text-sm font-bold"
                required
              />
              <p className="text-[11px] text-slate-400">
                টাকা পাঠানোর পর বিকাশ/নগদ অ্যাপ বা মেসেজে পাওয়া ট্রানজেকশন আইডিটি এখানে লিখুন।
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickPayOpen(false)}
                className="rounded-xl"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-[#0B6B3A] hover:bg-[#09572E] text-white font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    জমা হচ্ছে...
                  </>
                ) : (
                  'পেমেন্ট তথ্য নিশ্চিত করুন'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Voucher Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between font-heading font-bold text-lg">
              <span>{language === 'bn' ? 'পেমেন্ট ভাউচার' : 'Payment Voucher'}</span>
              <Button onClick={() => handlePrint()} size="sm" className="gap-2 rounded-xl bg-[#0B6B3A] text-white">
                <Printer className="w-4 h-4" />
                {language === 'bn' ? 'প্রিন্ট করুন' : 'Print'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {printTransaction && (
            <div className="mt-4 p-2 bg-slate-50 rounded-xl">
              <TransactionVoucher ref={voucherRef} transaction={printTransaction} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberDuesPage;
