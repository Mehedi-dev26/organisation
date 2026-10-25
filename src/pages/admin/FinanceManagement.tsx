import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Search,
  Trash2,
  Edit,
  Printer,
  Info,
  Receipt,
  RotateCcw,
  Upload,
  X,
  Calendar,
  MapPin,
  CheckCircle,
  MinusCircle,
  PlusCircle,
  Sparkles,
  ExternalLink,
  FileText,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import TransactionVoucher from '@/components/admin/TransactionVoucher';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { compressImage } from '@/lib/imageUtils';

export type TransactionType =
  | 'member_fee'
  | 'donation'
  | 'event_fee'
  | 'expense'
  | 'other_income'
  | 'other_expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description_bn: string | null;
  description_en: string | null;
  member_id: string | null;
  donor_name: string | null;
  donor_phone: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  transaction_date: string;
  month_year: string | null;
  notes: string | null;
  created_at: string;
  members?: { full_name: string } | null;
}

const transactionTypes: {
  value: TransactionType;
  label_bn: string;
  label_en: string;
  isIncome: boolean;
}[] = [
  { value: 'member_fee', label_bn: 'সদস্য চাঁদা', label_en: 'Member Fee', isIncome: true },
  { value: 'donation', label_bn: 'অনুদান / ডোনেশন', label_en: 'Donation', isIncome: true },
  { value: 'event_fee', label_bn: 'ইভেন্ট ফি', label_en: 'Event Fee', isIncome: true },
  { value: 'other_income', label_bn: 'অন্যান্য আয়', label_en: 'Other Income', isIncome: true },
  { value: 'expense', label_bn: 'সাধারণ খরচ', label_en: 'Expense', isIncome: false },
  { value: 'other_expense', label_bn: 'অন্যান্য ব্যয়', label_en: 'Other Expense', isIncome: false },
];

// Predefined Standard Organization Expense Categories
const EXPENSE_CATEGORIES = [
  'অফিস পরিচালনা ও ভাড়া',
  'চিকিৎসা সহায়তা ও ওষুধ বিতরণ',
  'জরুরি খাদ্য ও ত্রাণ সামগ্রী',
  'রক্তদান কর্মসূচি ও যাতায়াত',
  'সামাজিক ও সচেতনতামূলক ইভেন্ট',
  'মুদ্রণ, ব্যানার ও প্রকাশনা সামগ্রী',
  'মিটিং ও অতিথি আপ্যায়ন',
  'আইসিটি, ওয়েবসাইট ও এসএমএস গেটওয়ে',
  'ব্যাংক ও মোবাইল ব্যাংকিং চার্জ',
  'অন্যান্য প্রশাসনিক খরচ',
];

const paymentMethods = [
  { value: 'cash', label_bn: 'নগদ (Cash)', label_en: 'Cash' },
  { value: 'bkash', label_bn: 'বিকাশ (bKash)', label_en: 'bKash' },
  { value: 'nagad', label_bn: 'নগদ (Nagad)', label_en: 'Nagad' },
  { value: 'rocket', label_bn: 'রকেট (Rocket)', label_en: 'Rocket' },
  { value: 'bank', label_bn: 'ব্যাংক একাউন্ট', label_en: 'Bank' },
];

// Generate unique transaction ID: TRX-YYYYMMDD-XXXX
const generateTransactionId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `TRX-${year}${month}${day}-${random}`;
};

// Helper to parse notes for receipt URL, category, location, and clean text
export const parseTransactionMeta = (notes: string | null) => {
  if (!notes) return { text: '', receiptUrl: null, expenseCategory: null, location: null };

  let receiptUrl: string | null = null;
  let expenseCategory: string | null = null;
  let location: string | null = null;
  let text = notes;

  const voucherMatch = text.match(/\[(?:ভাউচার|রসিদ|Receipt):\s*(https?:\/\/[^\s\]]+)\]/i);
  if (voucherMatch) {
    receiptUrl = voucherMatch[1];
    text = text.replace(voucherMatch[0], '').trim();
  }

  const categoryMatch = text.match(/\[(?:খাত|Category):\s*([^\]]+)\]/i);
  if (categoryMatch) {
    expenseCategory = categoryMatch[1].trim();
    text = text.replace(categoryMatch[0], '').trim();
  }

  const locationMatch = text.match(/\[(?:স্থান|Location):\s*([^\]]+)\]/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
    text = text.replace(locationMatch[0], '').trim();
  }

  return { text, receiptUrl, expenseCategory, location };
};

const FinanceManagement: React.FC = () => {
  const { language } = useLanguage();
  const { isAdmin, isCashier, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time subscription for transactions
  useRealtimeSubscription({ table: 'transactions', queryKey: ['transactions'] });

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [detailsTransaction, setDetailsTransaction] = useState<Transaction | null>(null);
  const [printTransaction, setPrintTransaction] = useState<Transaction | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  // Filters
  const [selectedTab, setSelectedTab] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');

  // Receipt image upload
  const [selectedReceipt, setSelectedReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'member_fee' as TransactionType,
    amount: '',
    description_bn: '',
    description_en: '',
    member_id: '',
    donor_name: '',
    donor_phone: '',
    payment_method: 'cash',
    payment_reference: generateTransactionId(),
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    month_year: format(new Date(), 'yyyy-MM'),
    notes: '',
    expense_category: '',
    location: '',
  });

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const voucherRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: voucherRef,
    documentTitle: `Voucher-${printTransaction?.payment_reference || 'receipt'}`,
  });

  const openPrintDialog = (transaction: Transaction) => {
    setPrintTransaction(transaction);
    setIsPrintDialogOpen(true);
  };

  // Fetch transactions
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, members(full_name)')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return (data || []) as Transaction[];
    },
  });

  // Fetch members for dropdown
  const { data: members } = useQuery({
    queryKey: ['members-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, member_id')
        .eq('status', 'approved')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch unpaid dues for selected member
  const { data: memberUnpaidDues } = useQuery({
    queryKey: ['member-unpaid-dues', formData.member_id],
    queryFn: async () => {
      if (!formData.member_id) return [];
      const { data, error } = await supabase
        .from('member_dues')
        .select('*')
        .eq('member_id', formData.member_id)
        .eq('is_paid', false)
        .order('month_year', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!formData.member_id && formData.type === 'member_fee',
  });

  const selectedMonthsTotal = useMemo(() => {
    if (!memberUnpaidDues) return 0;
    return memberUnpaidDues
      .filter((due) => selectedMonths.includes(due.month_year))
      .reduce((sum, due) => sum + Number(due.amount), 0);
  }, [memberUnpaidDues, selectedMonths]);

  // Totals
  const totalIncome = useMemo(() => {
    return (
      transactions
        ?.filter((t) => ['member_fee', 'donation', 'event_fee', 'other_income'].includes(t.type))
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0
    );
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return (
      transactions
        ?.filter((t) => ['expense', 'other_expense'].includes(t.type))
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0
    );
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((t) => {
      const isIncome = ['member_fee', 'donation', 'event_fee', 'other_income'].includes(t.type);

      // 1. Top 4 Buttons Tab Filter
      if (selectedTab === 'income' && !isIncome) return false;
      if (selectedTab === 'expense' && isIncome) return false;

      // 2. Specific Type Dropdown Filter
      if (filterType !== 'all' && t.type !== filterType) return false;

      // 3. Payment Method Filter
      if (filterPaymentMethod !== 'all' && t.payment_method !== filterPaymentMethod) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDescBn = t.description_bn?.toLowerCase().includes(q);
        const matchesDescEn = t.description_en?.toLowerCase().includes(q);
        const matchesDonor = t.donor_name?.toLowerCase().includes(q);
        const matchesPhone = t.donor_phone?.toLowerCase().includes(q);
        const matchesMember = t.members?.full_name?.toLowerCase().includes(q);
        const matchesRef = t.payment_reference?.toLowerCase().includes(q);
        const matchesAmount = String(t.amount).includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);

        if (
          !matchesDescBn &&
          !matchesDescEn &&
          !matchesDonor &&
          !matchesPhone &&
          !matchesMember &&
          !matchesRef &&
          !matchesAmount &&
          !matchesNotes
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedTab, filterType, filterPaymentMethod, searchQuery]);

  // Log activity helper
  const logActivity = async (
    actionType: string,
    entityType: string,
    entityId: string,
    descriptionBn: string,
    descriptionEn: string,
    metadata: Record<string, unknown> = {}
  ) => {
    try {
      let userName = 'Admin';
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.full_name) userName = profile.full_name;
      }

      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_name: userName,
        user_role: isAdmin ? 'admin' : 'cashier',
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        description_bn: descriptionBn,
        description_en: descriptionEn,
        metadata: metadata as any,
      });
    } catch (e) {
      console.error('Error logging activity:', e);
    }
  };

  // Receipt image upload
  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'রসিদের ছবি ৫MB এর কম হতে হবে' : 'Receipt must be under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedReceipt(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadReceiptFile = async (): Promise<string | null> => {
    if (!selectedReceipt) return null;

    try {
      setIsUploadingReceipt(true);
      const compressedBlob = await compressImage(selectedReceipt, 1000, 1000, 0.88);
      const fileName = `receipts/${Date.now()}-${selectedReceipt.name.replace(/\s+/g, '_')}`;

      const { data, error } = await supabase.storage
        .from('member-photos')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('member-photos').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Receipt upload error:', error);
      toast({
        title: language === 'bn' ? 'রসিদ আপলোড ব্যর্থ' : 'Receipt upload failed',
        description: error.message || 'ত্রুটি ঘটেছে',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Create Transaction Mutation
  const createMutation = useMutation({
    mutationFn: async (dataToSubmit: typeof formData & { selectedMonths?: string[] }) => {
      const finalReceiptUrl = await uploadReceiptFile();

      // Encode metadata into notes
      const notesParts = [
        dataToSubmit.notes.trim(),
        dataToSubmit.expense_category ? `[খাত: ${dataToSubmit.expense_category}]` : '',
        dataToSubmit.location ? `[স্থান: ${dataToSubmit.location}]` : '',
        finalReceiptUrl ? `[ভাউচার: ${finalReceiptUrl}]` : '',
      ].filter(Boolean);

      const encodedNotes = notesParts.join('\n') || null;

      const { data: transactionData, error } = await supabase
        .from('transactions')
        .insert({
          type: dataToSubmit.type,
          amount: parseFloat(dataToSubmit.amount),
          description_bn: dataToSubmit.description_bn || null,
          description_en: dataToSubmit.description_en || null,
          member_id: dataToSubmit.member_id || null,
          donor_name: dataToSubmit.donor_name || null,
          donor_phone: dataToSubmit.donor_phone || null,
          payment_method: dataToSubmit.payment_method,
          payment_reference: dataToSubmit.payment_reference || generateTransactionId(),
          transaction_date: dataToSubmit.transaction_date,
          month_year: dataToSubmit.month_year || null,
          notes: encodedNotes,
        })
        .select()
        .single();

      if (error) throw error;

      // Update dues if member fee
      const monthsToProcess = dataToSubmit.selectedMonths || (dataToSubmit.month_year ? [dataToSubmit.month_year] : []);
      if (dataToSubmit.type === 'member_fee' && dataToSubmit.member_id && monthsToProcess.length > 0) {
        for (const mYear of monthsToProcess) {
          const { data: existingDue } = await supabase
            .from('member_dues')
            .select('id')
            .eq('member_id', dataToSubmit.member_id)
            .eq('month_year', mYear)
            .maybeSingle();

          if (existingDue) {
            await supabase
              .from('member_dues')
              .update({
                is_paid: true,
                paid_date: dataToSubmit.transaction_date,
                transaction_id: transactionData.id,
              })
              .eq('id', existingDue.id);
          } else {
            await supabase.from('member_dues').insert({
              member_id: dataToSubmit.member_id,
              month_year: mYear,
              amount: 100,
              is_paid: true,
              paid_date: dataToSubmit.transaction_date,
              transaction_id: transactionData.id,
            });
          }
        }
      }

      await logActivity(
        'create',
        'transaction',
        transactionData.id,
        `${dataToSubmit.type === 'expense' ? 'খরচ' : 'আয়'}: ৳${dataToSubmit.amount} যোগ করা হয়েছে`,
        `Added ${dataToSubmit.type}: ৳${dataToSubmit.amount}`,
        { type: dataToSubmit.type, amount: dataToSubmit.amount }
      );

      return transactionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'লেনদেন সফলভাবে সম্পন্ন হয়েছে।' : 'Transaction added successfully.',
      });
      resetForm();
    },
    onError: (err: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Update Transaction Mutation
  const updateMutation = useMutation({
    mutationFn: async (dataToSubmit: typeof formData & { id: string }) => {
      let finalReceiptUrl = await uploadReceiptFile();

      // If user didn't upload new receipt, keep existing if present in preview
      if (!finalReceiptUrl && receiptPreview && receiptPreview.startsWith('http')) {
        finalReceiptUrl = receiptPreview;
      }

      const notesParts = [
        dataToSubmit.notes.trim(),
        dataToSubmit.expense_category ? `[খাত: ${dataToSubmit.expense_category}]` : '',
        dataToSubmit.location ? `[স্থান: ${dataToSubmit.location}]` : '',
        finalReceiptUrl ? `[ভাউচার: ${finalReceiptUrl}]` : '',
      ].filter(Boolean);

      const encodedNotes = notesParts.join('\n') || null;

      const { error } = await supabase
        .from('transactions')
        .update({
          type: dataToSubmit.type,
          amount: parseFloat(dataToSubmit.amount),
          description_bn: dataToSubmit.description_bn || null,
          description_en: dataToSubmit.description_en || null,
          member_id: dataToSubmit.member_id || null,
          donor_name: dataToSubmit.donor_name || null,
          donor_phone: dataToSubmit.donor_phone || null,
          payment_method: dataToSubmit.payment_method,
          payment_reference: dataToSubmit.payment_reference || null,
          transaction_date: dataToSubmit.transaction_date,
          month_year: dataToSubmit.month_year || null,
          notes: encodedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dataToSubmit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'লেনদেনের তথ্য আপডেট হয়েছে।' : 'Transaction updated.',
      });
      resetForm();
    },
    onError: (err: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Delete Transaction Mutation
  const deleteMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      if (transaction.type === 'member_fee' && transaction.member_id) {
        await supabase
          .from('member_dues')
          .update({
            is_paid: false,
            paid_date: null,
            transaction_id: null,
            payment_status: 'unpaid',
          })
          .eq('member_id', transaction.member_id)
          .eq('is_paid', true);
      }

      const { error } = await supabase.from('transactions').delete().eq('id', transaction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      toast({
        title: language === 'bn' ? 'মুছে ফেলা হয়েছে' : 'Deleted',
        description: language === 'bn' ? 'লেনদেন মুছে ফেলা হয়েছে।' : 'Transaction deleted.',
      });
    },
  });

  // Form Reset
  const resetForm = () => {
    setFormData({
      type: 'member_fee',
      amount: '',
      description_bn: '',
      description_en: '',
      member_id: '',
      donor_name: '',
      donor_phone: '',
      payment_method: 'cash',
      payment_reference: generateTransactionId(),
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      month_year: format(new Date(), 'yyyy-MM'),
      notes: '',
      expense_category: '',
      location: '',
    });
    setSelectedMonths([]);
    setSelectedReceipt(null);
    setReceiptPreview(null);
    setEditingTransaction(null);
    setIsDialogOpen(false);
  };

  // Open Add Modal with pre-configured type
  const openAddModal = (presetType?: TransactionType) => {
    resetForm();
    const targetType = presetType || 'expense';
    setFormData((prev) => ({
      ...prev,
      type: targetType,
      payment_reference: generateTransactionId(),
      expense_category: targetType === 'expense' ? EXPENSE_CATEGORIES[0] : '',
    }));
    setIsDialogOpen(true);
  };

  // Open Edit Form
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    const meta = parseTransactionMeta(transaction.notes);

    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description_bn: transaction.description_bn || '',
      description_en: transaction.description_en || '',
      member_id: transaction.member_id || '',
      donor_name: transaction.donor_name || '',
      donor_phone: transaction.donor_phone || '',
      payment_method: transaction.payment_method || 'cash',
      payment_reference: transaction.payment_reference || '',
      transaction_date: transaction.transaction_date,
      month_year: transaction.month_year || '',
      notes: meta.text,
      expense_category: meta.expenseCategory || '',
      location: meta.location || '',
    });

    setReceiptPreview(meta.receiptUrl);
    setIsDialogOpen(true);
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      updateMutation.mutate({ ...formData, id: editingTransaction.id });
    } else {
      if (formData.type === 'member_fee' && selectedMonths.length > 0) {
        createMutation.mutate({
          ...formData,
          amount: selectedMonthsTotal.toString(),
          selectedMonths,
        });
      } else {
        createMutation.mutate(formData);
      }
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    const found = transactionTypes.find((t) => t.value === type);
    return language === 'bn' ? found?.label_bn : found?.label_en;
  };

  const getPaymentLabel = (method: string) => {
    const found = paymentMethods.find((p) => p.value === method);
    return language === 'bn' ? found?.label_bn : found?.label_en;
  };

  if (!isAdmin && !isCashier) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {language === 'bn' ? 'আপনার এই পেজে প্রবেশাধিকার নেই' : 'You do not have access to this page'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#14231B] dark:text-foreground flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#0B6B3A]">
              <Wallet className="w-5 h-5" />
            </div>
            {language === 'bn' ? 'আর্থিক ব্যবস্থাপনা ও হিসাব' : 'Finance & Accounts Management'}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {language === 'bn'
              ? 'সময়ের বাতিঘরের মোট আয়, নতুন খরচ, ভাউচার রসিদ আপলোড ও তহবিল স্থিতি নিয়ন্ত্রণ করুন'
              : 'Monitor revenue, add expenses with receipt vouchers, track balances & download vouchers.'}
          </p>
        </div>

        {/* Action Buttons: New Expense, New Income, All Transactions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 border-emerald-200 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300"
          >
            <RefreshCw className="w-4 h-4" />
            {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </Button>

          {/* New Expense Button (Dedicated Shortcut) */}
          <Button
            size="sm"
            onClick={() => openAddModal('expense')}
            className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-sm font-medium"
          >
            <MinusCircle className="w-4 h-4" />
            {language === 'bn' ? 'নতুন খরচ যোগ করুন' : 'Add Expense'}
          </Button>

          {/* New Income Button (Dedicated Shortcut) */}
          <Button
            size="sm"
            onClick={() => openAddModal('donation')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            {language === 'bn' ? 'নতুন আয় যোগ করুন' : 'Add Income'}
          </Button>

          {/* Standard Transaction Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => openAddModal('member_fee')}
            className="gap-1.5 border-emerald-300 hover:bg-emerald-50 text-emerald-800"
          >
            <Plus className="w-4 h-4" />
            {language === 'bn' ? 'নতুন লেনদেন' : 'New Transaction'}
          </Button>
        </div>
      </div>

      {/* Top 4 Interactive Stat Cards (Matching Blood Donors & Members Design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Net Balance */}
        <button
          type="button"
          onClick={() => setSelectedTab('all')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedTab === 'all'
              ? 'ring-2 ring-[#0B6B3A] border-[#0B6B3A] bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'hover:border-emerald-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B6B3A] shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'বর্তমান নিট তহবিল' : 'Net Balance'}
            </p>
            <h3
              className={`text-2xl font-bold truncate ${
                balance >= 0 ? 'text-[#0B6B3A]' : 'text-rose-600'
              }`}
            >
              ৳{balance.toLocaleString()}
            </h3>
          </div>
        </button>

        {/* 2. Total Income */}
        <button
          type="button"
          onClick={() => setSelectedTab('income')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedTab === 'income'
              ? 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'hover:border-emerald-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'মোট সংগৃহীত আয়' : 'Total Income'}
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 truncate">
              ৳{totalIncome.toLocaleString()}
            </h3>
          </div>
        </button>

        {/* 3. Total Expenses (Clickable filter) */}
        <button
          type="button"
          onClick={() => setSelectedTab('expense')}
          className={`text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer ${
            selectedTab === 'expense'
              ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
              : 'hover:border-rose-300'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'মোট খরচ / ব্যয়' : 'Total Expense'}
            </p>
            <h3 className="text-2xl font-bold text-rose-600 truncate">
              ৳{totalExpense.toLocaleString()}
            </h3>
          </div>
        </button>

        {/* 4. Total Transactions Count */}
        <button
          type="button"
          onClick={() => setSelectedTab('all')}
          className="text-left bg-card border rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3.5 hover:shadow-md cursor-pointer hover:border-emerald-300"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {language === 'bn' ? 'মোট লেনদেন সংখ্যা' : 'Transactions'}
            </p>
            <h3 className="text-2xl font-bold text-blue-600">{transactions?.length || 0}</h3>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar Directly Below the 4 Buttons */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'ট্রানজেকশন আইডি, বিবরণ, সদস্যের নাম, দাতার নাম বা টাকার পরিমাণ খুঁজুন...'
                  : 'Search by transaction ID, description, member name, donor or amount...'
              }
              className="pl-9 h-10 text-sm rounded-xl border-emerald-100 focus-visible:ring-[#0B6B3A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-48">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder={language === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সকল ধরন' : 'All Types'}</SelectItem>
                {transactionTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {language === 'bn' ? t.label_bn : t.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Filter */}
          <div className="w-full md:w-44">
            <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder={language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সকল মাধ্যম' : 'All Methods'}</SelectItem>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>
                    {language === 'bn' ? pm.label_bn : pm.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {(selectedTab !== 'all' ||
            filterType !== 'all' ||
            filterPaymentMethod !== 'all' ||
            searchQuery.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTab('all');
                setFilterType('all');
                setFilterPaymentMethod('all');
                setSearchQuery('');
              }}
              className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {language === 'bn' ? 'রিসেট' : 'Reset'}
            </Button>
          )}
        </div>

        {/* Status Count Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span>
            {language === 'bn'
              ? `প্রদর্শিত হচ্ছে ${filteredTransactions.length} টি লেনদেন (${
                  selectedTab === 'all'
                    ? 'সকল হিসাব'
                    : selectedTab === 'income'
                    ? 'আয়'
                    : 'খরচ'
                })`
              : `Showing ${filteredTransactions.length} transactions (${selectedTab})`}
          </span>
          <span className="font-medium text-[#0B6B3A]">
            {language === 'bn' ? 'সময়ের বাতিঘর সেন্ট্রাল অ্যাকাউন্টস' : 'Somoyer Batighor Central Accounts'}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
              <p className="text-sm font-medium">
                {language === 'bn' ? 'আর্থিক লেনদেনের তথ্য লোড হচ্ছে...' : 'Loading transactions ledger...'}
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#0B6B3A] mx-auto flex items-center justify-center mb-3">
                <Wallet className="w-8 h-8 opacity-60" />
              </div>
              <h4 className="text-base font-semibold text-foreground">
                {language === 'bn' ? 'কোন লেনদেন পাওয়া যায়নি' : 'No transactions found'}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'আপনার সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো আয় বা ব্যয়ের তথ্য পাওয়া যায়নি।'
                  : 'No transaction matches the current filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-50/60">
                    <TableHead className="font-semibold">{language === 'bn' ? 'তারিখ ও সময়' : 'Date'}</TableHead>
                    <TableHead className="font-semibold">{language === 'bn' ? 'ট্রানজেকশন আইডি' : 'TRX ID'}</TableHead>
                    <TableHead className="font-semibold">{language === 'bn' ? 'ধরন ও খাত' : 'Type & Category'}</TableHead>
                    <TableHead className="font-semibold">{language === 'bn' ? 'বিবরণ ও পক্ষ' : 'Description / Party'}</TableHead>
                    <TableHead className="font-semibold">{language === 'bn' ? 'পদ্ধতি' : 'Method'}</TableHead>
                    <TableHead className="font-semibold text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead className="w-16 text-center font-semibold">{language === 'bn' ? 'রসিদ' : 'Receipt'}</TableHead>
                    <TableHead className="w-36 text-right font-semibold pr-4">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const isIncome = ['member_fee', 'donation', 'event_fee', 'other_income'].includes(
                      transaction.type
                    );
                    const meta = parseTransactionMeta(transaction.notes);

                    return (
                      <TableRow
                        key={transaction.id}
                        className="hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-colors"
                      >
                        {/* Date */}
                        <TableCell className="py-3">
                          <div className="font-medium text-xs text-foreground">
                            {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {transaction.created_at
                              ? format(new Date(transaction.created_at), 'hh:mm a')
                              : ''}
                          </div>
                        </TableCell>

                        {/* Transaction ID */}
                        <TableCell className="py-3">
                          <span className="font-mono text-xs font-semibold text-[#0B6B3A] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            {transaction.payment_reference || 'TRX-N/A'}
                          </span>
                        </TableCell>

                        {/* Type & Category */}
                        <TableCell className="py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isIncome
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                            }`}
                          >
                            {getTypeLabel(transaction.type)}
                          </span>
                          {meta.expenseCategory && (
                            <span className="text-[11px] text-muted-foreground block mt-0.5 font-medium">
                              {meta.expenseCategory}
                            </span>
                          )}
                        </TableCell>

                        {/* Description & Party */}
                        <TableCell className="py-3">
                          <div className="text-xs font-medium text-foreground max-w-[220px] truncate">
                            {language === 'bn'
                              ? transaction.description_bn || transaction.description_en || 'সাধারণ লেনদেন'
                              : transaction.description_en || transaction.description_bn || 'Transaction'}
                          </div>
                          {transaction.members?.full_name && (
                            <div className="text-[11px] text-[#0B6B3A] font-semibold flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" />
                              <span>{transaction.members.full_name}</span>
                            </div>
                          )}
                          {transaction.donor_name && (
                            <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                              <span>দাতার নাম: {transaction.donor_name}</span>
                              {transaction.donor_phone && (
                                <span className="font-mono text-[10px]">({transaction.donor_phone})</span>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Payment Method */}
                        <TableCell className="py-3">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getPaymentLabel(transaction.payment_method || 'cash')}
                          </span>
                        </TableCell>

                        {/* Amount */}
                        <TableCell
                          className={`text-right py-3 font-bold font-mono text-sm ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}৳{Number(transaction.amount).toLocaleString()}
                        </TableCell>

                        {/* Receipt Icon / Thumbnail */}
                        <TableCell className="text-center py-3">
                          {meta.receiptUrl ? (
                            <button
                              type="button"
                              onClick={() => setDetailsTransaction(transaction)}
                              className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 transition-colors mx-auto"
                              title={language === 'bn' ? 'রসিদের ছবি দেখুন' : 'View Receipt'}
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">-</span>
                          )}
                        </TableCell>

                        {/* Actions (Including Dedicated "i" Details Button!) */}
                        <TableCell className="text-right py-3 pr-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* "i" Details Button (Requested by User) */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-lg text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                              onClick={() => setDetailsTransaction(transaction)}
                              title={language === 'bn' ? 'বিস্তারিত তথ্য দেখুন (i)' : 'View Details (i)'}
                            >
                              <Info className="w-4 h-4" />
                            </Button>

                            {/* Print Voucher Button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-lg text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                              onClick={() => openPrintDialog(transaction)}
                              title={language === 'bn' ? 'ভাউচার প্রিন্ট' : 'Print Voucher'}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>

                            {/* Edit Button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => handleEdit(transaction)}
                              disabled={!isAdmin && !isCashier}
                              title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            {/* Delete Button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    language === 'bn'
                                      ? `আপনি কি নিশ্চিতভাবে এই ৳${transaction.amount} টাকার লেনদেনটি মুছে ফেলতে চান?`
                                      : `Are you sure you want to delete this transaction of ৳${transaction.amount}?`
                                  )
                                ) {
                                  deleteMutation.mutate(transaction);
                                }
                              }}
                              disabled={!isAdmin && !isCashier}
                              title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          Add / Edit Transaction Modal (With Expense Categories & Receipt Upload)
      ========================================================================= */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#14231B] dark:text-foreground">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  formData.type === 'expense' || formData.type === 'other_expense'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-[#0B6B3A]'
                }`}
              >
                {formData.type === 'expense' || formData.type === 'other_expense' ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
              </div>
              {editingTransaction
                ? language === 'bn'
                  ? 'লেনদেন সম্পাদনা'
                  : 'Edit Transaction'
                : formData.type === 'expense'
                ? language === 'bn'
                  ? 'নতুন খরচ / ব্যয় ভাউচার'
                  : 'New Expense Voucher'
                : language === 'bn'
                ? 'নতুন আয় / প্রাপ্তি ভাউচার'
                : 'New Income Voucher'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* 1. Transaction Type and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {language === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'} *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: TransactionType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {language === 'bn' ? type.label_bn : type.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* If Expense, show Expense Category Selector */}
              {(formData.type === 'expense' || formData.type === 'other_expense') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'খরচের নির্দিষ্ট খাত (Category)' : 'Expense Category'} *
                  </Label>
                  <Select
                    value={formData.expense_category}
                    onValueChange={(cat) =>
                      setFormData((prev) => ({
                        ...prev,
                        expense_category: cat,
                        description_bn: prev.description_bn ? prev.description_bn : cat,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder={language === 'bn' ? 'খরচের খাত বেছে নিন' : 'Choose category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* If Member Fee, show Member Picker */}
              {formData.type === 'member_fee' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Select Member'} *
                  </Label>
                  <Select
                    value={formData.member_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, member_id: value });
                      setSelectedMonths([]);
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder={language === 'bn' ? 'সদস্য বেছে নিন' : 'Select member'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {members?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name} ({member.member_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Member Unpaid Dues Checklist if Member Fee */}
            {formData.type === 'member_fee' && formData.member_id && (
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 space-y-2">
                <Label className="text-xs font-bold text-amber-800">
                  {language === 'bn' ? 'বকেয়া মাসের তালিকা (একাধিক নির্বাচন করুন):' : 'Select Months to Pay:'}
                </Label>
                {memberUnpaidDues && memberUnpaidDues.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {memberUnpaidDues.map((due) => (
                      <label
                        key={due.id}
                        className="flex items-center gap-2 p-2 bg-white rounded border text-xs cursor-pointer hover:bg-amber-50"
                      >
                        <Checkbox
                          checked={selectedMonths.includes(due.month_year)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMonths((prev) => [...prev, due.month_year]);
                            } else {
                              setSelectedMonths((prev) => prev.filter((m) => m !== due.month_year));
                            }
                          }}
                        />
                        <span className="font-mono">{due.month_year}</span>
                        <span className="font-bold text-emerald-700 ml-auto">৳{due.amount}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'এই সদস্যের কোনো বকেয়া চাঁদা নেই।' : 'No unpaid dues found.'}
                  </p>
                )}
              </div>
            )}

            {/* Amount, Date, Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Amount */}
              {(formData.type !== 'member_fee' || selectedMonths.length === 0) && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (BDT)'} *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="৳ 0.00"
                    required
                    className="h-10 text-sm font-mono font-bold"
                  />
                </div>
              )}

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {language === 'bn' ? 'লেনদেনের তারিখ' : 'Date'} *
                </Label>
                <Input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                  className="h-10 text-sm font-mono"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'} *
                </Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {language === 'bn' ? m.label_bn : m.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Donor Fields if Donation */}
            {formData.type === 'donation' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'দাতার পুরো নাম' : 'Donor Full Name'}
                  </Label>
                  <Input
                    value={formData.donor_name}
                    onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: হাজী মো: করিম' : 'Donor Name'}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {language === 'bn' ? 'দাতার ফোন নম্বর' : 'Donor Phone'}
                  </Label>
                  <Input
                    value={formData.donor_phone}
                    onChange={(e) => setFormData({ ...formData, donor_phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>
            )}

            {/* Where Spent (Location) & Transaction Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {language === 'bn' ? 'কোথায় / কোন স্থানে খরচ করা হয়েছে' : 'Spending Location / Venue'}
                </Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={language === 'bn' ? 'যেমন: নওগাঁ সদর অফিস, ঢাকা রোড' : 'e.g. Naogaon Central Office'}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {language === 'bn' ? 'ট্রানজেকশন রেফারেন্স আইডি' : 'TRX Reference'}
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={formData.payment_reference}
                    readOnly
                    className="h-9 text-xs font-mono bg-muted"
                  />
                  {!editingTransaction && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, payment_reference: generateTransactionId() })}
                      className="h-9 px-2 text-xs"
                    >
                      {language === 'bn' ? 'নতুন' : 'New'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Description (Bengali & English) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {language === 'bn' ? 'বিবরণ (বাংলা)' : 'Description (Bengali)'}
                </Label>
                <Input
                  value={formData.description_bn}
                  onChange={(e) => setFormData({ ...formData, description_bn: e.target.value })}
                  placeholder={language === 'bn' ? 'খরচের মূল উদ্দেশ্য লিখুন' : 'Description'}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {language === 'bn' ? 'বিবরণ (English)' : 'Description (English)'}
                </Label>
                <Input
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  placeholder="Purpose of transaction"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {language === 'bn' ? 'মন্তব্য ও অতিরিক্ত তথ্য' : 'Notes / Remarks'}
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder={language === 'bn' ? 'অনুমোদনকারীর নাম বা অতিরিক্ত নোট...' : 'Additional notes...'}
                className="text-sm"
              />
            </div>

            {/* Receipt / Voucher Image Upload Section */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B6B3A] flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {language === 'bn' ? 'খরচের রসিদ / ভাউচারের ছবি আপলোড' : 'Receipt / Voucher Photo'}
              </h4>

              <div className="flex items-center gap-3">
                {receiptPreview ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-emerald-300 shadow-sm shrink-0">
                    <img src={receiptPreview} alt="Receipt Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-5 h-5 rounded-full"
                      onClick={() => {
                        setSelectedReceipt(null);
                        setReceiptPreview(null);
                        if (receiptInputRef.current) receiptInputRef.current.value = '';
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted border border-dashed border-emerald-300 flex items-center justify-center text-muted-foreground shrink-0">
                    <Receipt className="w-7 h-7 text-emerald-600/60" />
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptSelect}
                    className="hidden"
                    id="finance-receipt-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => receiptInputRef.current?.click()}
                    className="gap-2 border-emerald-300 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {language === 'bn' ? 'রসিদের ছবি যুক্ত করুন' : 'Attach Receipt Image'}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    {language === 'bn'
                      ? 'দোকানের ক্যাশ মেমো, বিল বা ব্যাংক স্লিপের স্পষ্ট ছবি দিন।'
                      : 'Upload photo of cash memo, bill or bank receipt.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || isUploadingReceipt}
                className="bg-[#0B6B3A] hover:bg-[#09542e] text-white rounded-xl gap-2 font-medium"
              >
                {(createMutation.isPending || updateMutation.isPending || isUploadingReceipt) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isUploadingReceipt
                  ? language === 'bn'
                    ? 'রসিদ আপলোড হচ্ছে...'
                    : 'Uploading receipt...'
                  : editingTransaction
                  ? language === 'bn'
                    ? 'আপডেট করুন'
                    : 'Update Transaction'
                  : language === 'bn'
                  ? 'লেনদেন সংরক্ষণ করুন'
                  : 'Save Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Advanced Transaction Details Modal ("i" Button)
      ========================================================================= */}
      <Dialog open={!!detailsTransaction} onOpenChange={() => setDetailsTransaction(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl">
          {detailsTransaction && (() => {
            const isIncome = ['member_fee', 'donation', 'event_fee', 'other_income'].includes(
              detailsTransaction.type
            );
            const meta = parseTransactionMeta(detailsTransaction.notes);

            return (
              <div>
                {/* Header Banner */}
                <div
                  className={`p-5 text-white ${
                    isIncome
                      ? 'bg-gradient-to-r from-[#0B6B3A] to-[#14532d]'
                      : 'bg-gradient-to-r from-rose-700 via-rose-800 to-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/20 border border-white/20">
                      {detailsTransaction.payment_reference || 'TRX-ID'}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20 h-7 w-7 rounded-lg"
                      onClick={() => setDetailsTransaction(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-white/80">
                      {isIncome ? 'প্রাপ্ত আয়ের মোট পরিমাণ' : 'পরিশোধিত ব্যয়ের মোট পরিমাণ'}
                    </p>
                    <h2 className="text-3xl font-bold font-mono tracking-tight mt-0.5">
                      {isIncome ? '+' : '-'}৳{Number(detailsTransaction.amount).toLocaleString()}
                    </h2>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3.5 rounded-xl border">
                    <div>
                      <p className="text-muted-foreground font-medium">লেনদেনের ধরন</p>
                      <p className="font-bold text-foreground text-sm mt-0.5">
                        {getTypeLabel(detailsTransaction.type)}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground font-medium">পেমেন্ট মেথড</p>
                      <p className="font-semibold text-foreground text-sm mt-0.5">
                        {getPaymentLabel(detailsTransaction.payment_method || 'cash')}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        তারিখ ও সময়
                      </p>
                      <p className="font-medium text-foreground mt-0.5">
                        {format(new Date(detailsTransaction.transaction_date), 'dd MMMM yyyy')}
                        {detailsTransaction.created_at && (
                          <span className="text-muted-foreground block text-[11px]">
                            {format(new Date(detailsTransaction.created_at), 'hh:mm a')}
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        স্থান / লোকেশন
                      </p>
                      <p className="font-medium text-foreground mt-0.5">
                        {meta.location || 'নওগাঁ সদর কার্যালয়'}
                      </p>
                    </div>

                    {meta.expenseCategory && (
                      <div className="col-span-2 border-t pt-2 mt-1">
                        <p className="text-muted-foreground font-medium">নির্দিষ্ট খরচের খাত</p>
                        <p className="font-semibold text-[#0B6B3A] text-sm mt-0.5">
                          {meta.expenseCategory}
                        </p>
                      </div>
                    )}

                    {detailsTransaction.members?.full_name && (
                      <div className="col-span-2 border-t pt-2 mt-1">
                        <p className="text-muted-foreground font-medium">সংশ্লিষ্ট সদস্য</p>
                        <p className="font-semibold text-foreground text-sm mt-0.5">
                          {detailsTransaction.members.full_name}
                        </p>
                      </div>
                    )}

                    {detailsTransaction.donor_name && (
                      <div className="col-span-2 border-t pt-2 mt-1">
                        <p className="text-muted-foreground font-medium">দাতার বিবরণ</p>
                        <p className="font-semibold text-foreground text-sm mt-0.5">
                          {detailsTransaction.donor_name} {detailsTransaction.donor_phone && `(${detailsTransaction.donor_phone})`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description & Remarks */}
                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground font-medium">সম্পূর্ণ বিবরণ ও উদ্দেশ্য:</p>
                    <p className="text-foreground p-3 bg-card border rounded-xl leading-relaxed">
                      {detailsTransaction.description_bn ||
                        detailsTransaction.description_en ||
                        'কোনো বিবরণ যুক্ত করা হয়নি।'}
                    </p>
                    {meta.text && (
                      <p className="text-muted-foreground mt-1 italic pl-1">
                        নোট: {meta.text}
                      </p>
                    )}
                  </div>

                  {/* Receipt Voucher Image */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      সংযুক্ত রসিদ / ভাউচারের মূল কপি
                    </p>

                    {meta.receiptUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-300 shadow bg-black/5 p-1">
                        <img
                          src={meta.receiptUrl}
                          alt="Receipt Voucher"
                          className="w-full max-h-64 object-contain rounded-lg mx-auto"
                        />
                        <a
                          href={meta.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 shadow"
                        >
                          <ExternalLink className="w-3 h-3" />
                          ফুল ভিউ দেখুন
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/40 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                        <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-1" />
                        <p>কোনো ফটো রসিদ সংযুক্ত করা হয়নি।</p>
                        <p className="text-[11px] text-[#0B6B3A] font-medium mt-1">
                          ডিজিটাল সিস্টেম ভাউচার প্রিন্ট করতে নিচের বাটনে ক্লিক করুন।
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      className="flex-1 bg-[#0B6B3A] hover:bg-[#09542e] text-white gap-1.5"
                      onClick={() => {
                        openPrintDialog(detailsTransaction);
                        setDetailsTransaction(null);
                      }}
                    >
                      <Printer className="w-4 h-4" />
                      ভাউচার প্রিন্ট করুন
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        handleEdit(detailsTransaction);
                        setDetailsTransaction(null);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      সম্পাদনা
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Print Voucher Dialog
      ========================================================================= */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{language === 'bn' ? 'অফিসিয়াল ভাউচার প্রিন্ট' : 'Print Official Voucher'}</span>
              <Button onClick={() => handlePrint()} className="ml-4 bg-[#0B6B3A] hover:bg-[#09542e] text-white gap-2">
                <Printer className="h-4 w-4" />
                {language === 'bn' ? 'প্রিন্ট করুন' : 'Print'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {printTransaction && (
            <TransactionVoucher
              ref={voucherRef}
              transaction={printTransaction}
              language={language as 'bn' | 'en'}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceManagement;
