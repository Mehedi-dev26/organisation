import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMember, DuesData } from '@/components/member/MemberContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  CheckCircle2
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

const MemberDuesPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { 
    memberData, 
    duesData, 
    duesLoading, 
    paidDues, 
    unpaidDues, 
    unpaidMonths, 
    monthlyFee, 
    yearlyTotal 
  } = useMember();

  // Voucher print state
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printTransaction, setPrintTransaction] = useState<TransactionData | null>(null);
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
            <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'bn' ? 'চাঁদা ও পেমেন্ট পোর্টাল' : 'Dues & Fees Portal'}</span>
          </div>
          <div className="mt-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-[#14231B] font-heading tracking-tight leading-tight">
              {language === 'bn' ? 'মাসিক ও বার্ষিক চাঁদা হিসাব' : 'Membership Dues & Accounts'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {language === 'bn' 
                ? 'আপনার সকল মাসের চাঁদার স্থিতি, এক বছরের মোট হিসাব ও পেমেন্ট রসিদ' 
                : 'Monthly dues status, 1-year total calculation and payment receipts'}
            </p>
          </div>
        </div>

        <Link
          to="/member/pay-dues"
          className="rounded-xl px-5 py-2.5 font-bold text-xs bg-[#0B6B3A] hover:bg-[#09572E] text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>{language === 'bn' ? 'অনলাইন চাঁদা পরিশোধ' : 'Pay Online'}</span>
        </Link>
      </div>

      {/* 2. Top 4 Activity Stat Cards (Dashboard style) */}
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

        {/* Card 4: ১ বছরের মোট চাঁদা */}
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
                {language === 'bn' ? '১ বছরের মোট প্রদেয়' : '1-Year Total'}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                ৳{yearlyTotal.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 3. Unpaid Months Callout */}
      {unpaidMonths.length > 0 && (
        <Card className="rounded-[24px] border border-amber-200 bg-gradient-to-r from-amber-50/70 to-amber-100/30 shadow-xs overflow-hidden">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' 
                    ? `আপনার মোট ${unpaidMonths.length} মাসের চাঁদা বকেয়া রয়েছে (৳${unpaidDues})` 
                    : `You have ${unpaidMonths.length} month(s) of unpaid dues (৳${unpaidDues})`}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {language === 'bn' 
                    ? 'সংগঠনের জনকল্যাণমূলক কার্যক্রম নিরবচ্ছিন্ন রাখতে অনুগ্রহ করে বকেয়া চাঁদা পরিশোধ করুন।' 
                    : 'Please clear your pending dues to support ongoing community welfare programs.'}
                </p>
              </div>
            </div>

            <Link
              to="/member/pay-dues"
              className="rounded-xl px-5 py-2.5 font-bold text-xs bg-[#0B6B3A] hover:bg-[#09572E] text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>{language === 'bn' ? 'এখনই পরিশোধ করুন' : 'Pay Pending Dues'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>
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
          <span className="text-xs text-slate-500 font-medium">
            {language === 'bn' ? `মোট: ${duesData.length}টি রেকর্ড` : `Total: ${duesData.length} records`}
          </span>
        </div>

        <CardContent className="p-0">
          {duesLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#0B6B3A]" />
            </div>
          ) : duesData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 border-slate-100">
                    <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'মাস ও বছর' : 'Month & Year'}</TableHead>
                    <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'চাঁদার পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'পরিশোধ স্ট্যাটাস' : 'Status'}</TableHead>
                    <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'পরিশোধের তারিখ' : 'Payment Date'}</TableHead>
                    <TableHead className="text-right font-bold text-slate-600 text-xs">{language === 'bn' ? 'রসিদ / ভাউচার' : 'Voucher'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duesData.map((due) => (
                    <TableRow key={due.id} className="hover:bg-slate-50/60 border-slate-100">
                      <TableCell className="font-bold text-slate-900 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{due.month_year}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-slate-800 text-sm">
                        ৳{due.amount}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-[11px] font-bold ${
                            due.is_paid 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {due.is_paid 
                            ? (language === 'bn' ? 'পরিশোধিত' : 'Paid') 
                            : (language === 'bn' ? 'বকেয়া' : 'Unpaid')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {due.paid_date ? due.paid_date : '-'}
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
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

      {/* Voucher Print Dialog */}
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
