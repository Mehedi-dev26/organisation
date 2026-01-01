import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

interface VoucherProps {
  transaction: {
    id: string;
    type: string;
    amount: number;
    description_bn: string | null;
    description_en: string | null;
    donor_name: string | null;
    donor_phone: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    transaction_date: string;
    month_year: string | null;
    notes: string | null;
    members?: { full_name: string } | null;
  };
  language: 'bn' | 'en';
}

const transactionTypeLabels: Record<string, { bn: string; en: string }> = {
  member_fee: { bn: 'সদস্য চাঁদা', en: 'Member Fee' },
  donation: { bn: 'ডোনেশন', en: 'Donation' },
  event_fee: { bn: 'ইভেন্ট ফি', en: 'Event Fee' },
  expense: { bn: 'খরচ', en: 'Expense' },
  other_income: { bn: 'অন্যান্য আয়', en: 'Other Income' },
  other_expense: { bn: 'অন্যান্য খরচ', en: 'Other Expense' },
};

const paymentMethodLabels: Record<string, { bn: string; en: string }> = {
  cash: { bn: 'নগদ', en: 'Cash' },
  bkash: { bn: 'বিকাশ', en: 'bKash' },
  nagad: { bn: 'নগদ', en: 'Nagad' },
  rocket: { bn: 'রকেট', en: 'Rocket' },
  bank: { bn: 'ব্যাংক', en: 'Bank' },
};

const TransactionVoucher = forwardRef<HTMLDivElement, VoucherProps>(
  ({ transaction, language }, ref) => {
    const isIncome = ['member_fee', 'donation', 'event_fee', 'other_income'].includes(transaction.type);
    const voucherType = isIncome ? (language === 'bn' ? 'জমা রশিদ' : 'Receipt Voucher') : (language === 'bn' ? 'খরচ রশিদ' : 'Payment Voucher');
    
    const getTypeLabel = (type: string) => {
      return transactionTypeLabels[type]?.[language] || type;
    };

    const getPaymentLabel = (method: string) => {
      return paymentMethodLabels[method]?.[language] || method;
    };

    // Convert number to Bengali words (simplified)
    const numberToBengaliWords = (num: number): string => {
      const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
      const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
      
      if (num === 0) return 'শূন্য';
      if (num >= 10000000) return `${numberToBengaliWords(Math.floor(num / 10000000))} কোটি ${numberToBengaliWords(num % 10000000)}`.trim();
      if (num >= 100000) return `${numberToBengaliWords(Math.floor(num / 100000))} লক্ষ ${numberToBengaliWords(num % 100000)}`.trim();
      if (num >= 1000) return `${numberToBengaliWords(Math.floor(num / 1000))} হাজার ${numberToBengaliWords(num % 1000)}`.trim();
      if (num >= 100) return `${numberToBengaliWords(Math.floor(num / 100))} শত ${numberToBengaliWords(num % 100)}`.trim();
      if (num >= 10) {
        const t = Math.floor(num / 10);
        const u = num % 10;
        return `${tens[t]} ${units[u]}`.trim();
      }
      return units[num];
    };

    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-2xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-1">সময়ের বাতিঘর</h1>
          <p className="text-sm text-gray-600">Samoyer Batighor</p>
          <p className="text-xs text-gray-500 mt-1">একটি সামাজিক ও সাংস্কৃতিক সংগঠন</p>
        </div>

        {/* Voucher Title */}
        <div className="text-center mb-6">
          <h2 className={`text-xl font-bold inline-block px-6 py-2 border-2 ${isIncome ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700'}`}>
            {voucherType}
          </h2>
        </div>

        {/* Voucher Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="flex">
            <span className="font-semibold w-32">{language === 'bn' ? 'ভাউচার নং:' : 'Voucher No:'}</span>
            <span className="font-mono">{transaction.payment_reference}</span>
          </div>
          <div className="flex justify-end">
            <span className="font-semibold w-20">{language === 'bn' ? 'তারিখ:' : 'Date:'}</span>
            <span>{format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="border border-gray-400 p-4 mb-6">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-semibold w-40">{language === 'bn' ? 'লেনদেনের ধরন:' : 'Transaction Type:'}</td>
                <td className="py-2">{getTypeLabel(transaction.type)}</td>
              </tr>
              
              {transaction.members?.full_name && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">{language === 'bn' ? 'সদস্যের নাম:' : 'Member Name:'}</td>
                  <td className="py-2">{transaction.members.full_name}</td>
                </tr>
              )}
              
              {transaction.donor_name && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">{language === 'bn' ? 'দাতার নাম:' : 'Donor Name:'}</td>
                  <td className="py-2">{transaction.donor_name}</td>
                </tr>
              )}
              
              {transaction.donor_phone && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">{language === 'bn' ? 'ফোন:' : 'Phone:'}</td>
                  <td className="py-2">{transaction.donor_phone}</td>
                </tr>
              )}

              {transaction.month_year && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">{language === 'bn' ? 'মাস-বছর:' : 'Month-Year:'}</td>
                  <td className="py-2">{transaction.month_year}</td>
                </tr>
              )}
              
              <tr className="border-b">
                <td className="py-2 font-semibold">{language === 'bn' ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:'}</td>
                <td className="py-2">{getPaymentLabel(transaction.payment_method || 'cash')}</td>
              </tr>
              
              {(transaction.description_bn || transaction.description_en) && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">{language === 'bn' ? 'বিবরণ:' : 'Description:'}</td>
                  <td className="py-2">{language === 'bn' ? transaction.description_bn : transaction.description_en}</td>
                </tr>
              )}
              
              {transaction.notes && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">{language === 'bn' ? 'নোট:' : 'Notes:'}</td>
                  <td className="py-2">{transaction.notes}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Amount Section */}
        <div className={`border-2 p-4 mb-6 ${isIncome ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">{language === 'bn' ? 'মোট টাকা:' : 'Total Amount:'}</span>
            <span className={`text-2xl font-bold ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
              ৳{Number(transaction.amount).toLocaleString('bn-BD')}
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            <span className="font-semibold">{language === 'bn' ? 'কথায়:' : 'In Words:'}</span>{' '}
            {language === 'bn' 
              ? `${numberToBengaliWords(Math.floor(Number(transaction.amount)))} টাকা মাত্র`
              : `Taka ${Number(transaction.amount).toLocaleString()} Only`
            }
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-8">
          <div className="text-center">
            <div className="border-t border-black pt-2">
              <p className="font-semibold">{language === 'bn' ? 'গ্রহীতার স্বাক্ষর' : 'Receiver Signature'}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-2">
              <p className="font-semibold">{language === 'bn' ? 'কোষাধ্যক্ষের স্বাক্ষর' : 'Treasurer Signature'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t text-xs text-gray-500">
          <p>{language === 'bn' ? 'এটি একটি কম্পিউটার জেনারেটেড রশিদ' : 'This is a computer generated receipt'}</p>
          <p className="mt-1">{language === 'bn' ? 'প্রিন্টের তারিখ:' : 'Print Date:'} {format(new Date(), 'dd/MM/yyyy hh:mm a')}</p>
        </div>
      </div>
    );
  }
);

TransactionVoucher.displayName = 'TransactionVoucher';

export default TransactionVoucher;
