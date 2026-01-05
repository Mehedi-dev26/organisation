import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, TrendingUp, TrendingDown, Wallet, Users, Search, Trash2, Edit, Printer } from 'lucide-react';
import { format } from 'date-fns';
import TransactionVoucher from '@/components/admin/TransactionVoucher';

type TransactionType = 'member_fee' | 'donation' | 'event_fee' | 'expense' | 'other_income' | 'other_expense';

interface Transaction {
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

const transactionTypes: { value: TransactionType; label_bn: string; label_en: string; isIncome: boolean }[] = [
  { value: 'member_fee', label_bn: 'সদস্য চাঁদা', label_en: 'Member Fee', isIncome: true },
  { value: 'donation', label_bn: 'ডোনেশন', label_en: 'Donation', isIncome: true },
  { value: 'event_fee', label_bn: 'ইভেন্ট ফি', label_en: 'Event Fee', isIncome: true },
  { value: 'other_income', label_bn: 'অন্যান্য আয়', label_en: 'Other Income', isIncome: true },
  { value: 'expense', label_bn: 'খরচ', label_en: 'Expense', isIncome: false },
  { value: 'other_expense', label_bn: 'অন্যান্য খরচ', label_en: 'Other Expense', isIncome: false },
];

const paymentMethods = [
  { value: 'cash', label_bn: 'নগদ', label_en: 'Cash' },
  { value: 'bkash', label_bn: 'বিকাশ', label_en: 'bKash' },
  { value: 'nagad', label_bn: 'নগদ', label_en: 'Nagad' },
  { value: 'rocket', label_bn: 'রকেট', label_en: 'Rocket' },
  { value: 'bank', label_bn: 'ব্যাংক', label_en: 'Bank' },
];

// Generate unique transaction ID: TRX-YYYYMMDD-XXXX
const generateTransactionId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit random
  return `TRX-${year}${month}${day}-${random}`;
};

const FinanceManagement = () => {
  const { language } = useLanguage();
  const { isAdmin, isCashier } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [printTransaction, setPrintTransaction] = useState<Transaction | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  
  const voucherRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: voucherRef,
    documentTitle: `Voucher-${printTransaction?.payment_reference || 'receipt'}`,
  });
  
  const openPrintDialog = (transaction: Transaction) => {
    setPrintTransaction(transaction);
    setIsPrintDialogOpen(true);
  };

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
  });
  
  // For multiple month selection
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, members(full_name)')
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
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
  const { data: memberUnpaidDues, isLoading: isLoadingDues } = useQuery({
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

  // Calculate total unpaid amount for selected member
  const totalUnpaidAmount = React.useMemo(() => {
    return memberUnpaidDues?.reduce((sum, due) => sum + Number(due.amount), 0) || 0;
  }, [memberUnpaidDues]);

  // Calculate selected months total
  const selectedMonthsTotal = React.useMemo(() => {
    if (!memberUnpaidDues) return 0;
    return memberUnpaidDues
      .filter(due => selectedMonths.includes(due.month_year))
      .reduce((sum, due) => sum + Number(due.amount), 0);
  }, [memberUnpaidDues, selectedMonths]);

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { selectedMonths?: string[] }) => {
      const monthsToProcess = data.selectedMonths || (data.month_year ? [data.month_year] : []);
      
      // Insert transaction
      const { data: transactionData, error } = await supabase.from('transactions').insert({
        type: data.type,
        amount: parseFloat(data.amount),
        description_bn: data.description_bn || null,
        description_en: data.description_en || null,
        member_id: data.member_id || null,
        donor_name: data.donor_name || null,
        donor_phone: data.donor_phone || null,
        payment_method: data.payment_method,
        payment_reference: data.payment_reference || null,
        transaction_date: data.transaction_date,
        month_year: monthsToProcess.length === 1 ? monthsToProcess[0] : monthsToProcess.join(', '),
        notes: data.notes || null,
      }).select().single();
      if (error) throw error;

      // If it's a member fee, update the member_dues table for all selected months
      if (data.type === 'member_fee' && data.member_id && monthsToProcess.length > 0) {
        for (const monthYear of monthsToProcess) {
          // Check if dues record exists for this member and month
          const { data: existingDue } = await supabase
            .from('member_dues')
            .select('id, amount')
            .eq('member_id', data.member_id)
            .eq('month_year', monthYear)
            .maybeSingle();

          if (existingDue) {
            // Update existing dues record
            const { error: updateError } = await supabase
              .from('member_dues')
              .update({
                is_paid: true,
                paid_date: data.transaction_date,
                transaction_id: transactionData.id,
              })
              .eq('id', existingDue.id);
            
            if (updateError) console.error('Error updating member_dues:', updateError);
          } else {
            // Create new dues record if it doesn't exist
            const { error: insertError } = await supabase
              .from('member_dues')
              .insert({
                member_id: data.member_id,
                month_year: monthYear,
                amount: 100, // Default amount
                is_paid: true,
                paid_date: data.transaction_date,
                transaction_id: transactionData.id,
              });
            
            if (insertError) console.error('Error creating member_dues:', insertError);
          }
        }
      }

      return transactionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'লেনদেন যোগ হয়েছে' : 'Transaction added',
      });
      resetForm();
    },
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          type: data.type,
          amount: parseFloat(data.amount),
          description_bn: data.description_bn || null,
          description_en: data.description_en || null,
          member_id: data.member_id || null,
          donor_name: data.donor_name || null,
          donor_phone: data.donor_phone || null,
          payment_method: data.payment_method,
          payment_reference: data.payment_reference || null,
          transaction_date: data.transaction_date,
          month_year: data.month_year || null,
          notes: data.notes || null,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'লেনদেন আপডেট হয়েছে' : 'Transaction updated',
      });
      resetForm();
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: language === 'bn' ? 'মুছে ফেলা হয়েছে' : 'Deleted',
        description: language === 'bn' ? 'লেনদেন মুছে ফেলা হয়েছে' : 'Transaction deleted',
      });
    },
  });

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
      payment_reference: generateTransactionId(), // Auto-generate new ID
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      month_year: format(new Date(), 'yyyy-MM'),
      notes: '',
    });
    setSelectedMonths([]);
    setEditingTransaction(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
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
      notes: transaction.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      updateMutation.mutate({ ...formData, id: editingTransaction.id });
    } else {
      // For member fees with multiple months selected
      if (formData.type === 'member_fee' && selectedMonths.length > 0) {
        createMutation.mutate({ ...formData, amount: selectedMonthsTotal.toString(), selectedMonths });
      } else {
        createMutation.mutate(formData);
      }
    }
  };

  // Calculate totals
  const totalIncome = transactions?.filter(t => 
    ['member_fee', 'donation', 'event_fee', 'other_income'].includes(t.type)
  ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalExpense = transactions?.filter(t => 
    ['expense', 'other_expense'].includes(t.type)
  ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const balance = totalIncome - totalExpense;

  // Filter transactions
  const filteredTransactions = transactions?.filter(t => {
    const matchesSearch = 
      t.description_bn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.members?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || t.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: TransactionType) => {
    const found = transactionTypes.find(t => t.value === type);
    return language === 'bn' ? found?.label_bn : found?.label_en;
  };

  const getPaymentLabel = (method: string) => {
    const found = paymentMethods.find(p => p.value === method);
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-heading font-bold text-primary">
            {language === 'bn' ? 'আর্থিক ব্যবস্থাপনা' : 'Finance Management'}
          </h1>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'নতুন লেনদেন' : 'New Transaction'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction 
                    ? (language === 'bn' ? 'লেনদেন সম্পাদনা' : 'Edit Transaction')
                    : (language === 'bn' ? 'নতুন লেনদেন যোগ করুন' : 'Add New Transaction')
                  }
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'}</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: TransactionType) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {language === 'bn' ? type.label_bn : type.label_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'পরিমাণ (টাকা)' : 'Amount (BDT)'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'তারিখ' : 'Date'}</Label>
                    <Input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {language === 'bn' ? method.label_bn : method.label_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === 'member_fee' && (
                    <>
                      <div className="space-y-2 md:col-span-2">
                        <Label>{language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Select Member'}</Label>
                        <Select
                          value={formData.member_id}
                          onValueChange={(value) => setFormData({ ...formData, member_id: value, month_year: '' })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Select member'} />
                          </SelectTrigger>
                          <SelectContent>
                            {members?.map(member => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.full_name} ({member.member_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show unpaid dues summary */}
                      {formData.member_id && (
                        <div className="md:col-span-2 p-4 bg-muted rounded-lg space-y-4">
                          {isLoadingDues ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">
                                {language === 'bn' ? 'বকেয়া লোড হচ্ছে...' : 'Loading dues...'}
                              </span>
                            </div>
                          ) : memberUnpaidDues && memberUnpaidDues.length > 0 ? (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                  {language === 'bn' ? 'মোট বকেয়া চাঁদা:' : 'Total Unpaid Dues:'}
                                </span>
                                <span className="text-lg font-bold text-destructive">
                                  ৳{totalUnpaidAmount.toLocaleString('bn-BD')}
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label>{language === 'bn' ? 'কোন মাসের চাঁদা পরিশোধ করবেন?' : 'Which month(s) to pay?'}</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (selectedMonths.length === memberUnpaidDues.length) {
                                        setSelectedMonths([]);
                                      } else {
                                        setSelectedMonths(memberUnpaidDues.map(d => d.month_year));
                                      }
                                    }}
                                  >
                                    {selectedMonths.length === memberUnpaidDues.length 
                                      ? (language === 'bn' ? 'সব বাদ দিন' : 'Deselect All')
                                      : (language === 'bn' ? 'সব নির্বাচন' : 'Select All')}
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                  {memberUnpaidDues.map(due => (
                                    <label
                                      key={due.id}
                                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                                        selectedMonths.includes(due.month_year)
                                          ? 'bg-primary/10 border-primary'
                                          : 'bg-background border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <Checkbox
                                        checked={selectedMonths.includes(due.month_year)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedMonths([...selectedMonths, due.month_year]);
                                          } else {
                                            setSelectedMonths(selectedMonths.filter(m => m !== due.month_year));
                                          }
                                        }}
                                      />
                                      <span className="text-sm">
                                        {due.month_year} - ৳{Number(due.amount).toLocaleString('bn-BD')}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Selected months summary */}
                              {selectedMonths.length > 0 && (
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                      {language === 'bn' 
                                        ? `${selectedMonths.length} মাস নির্বাচিত` 
                                        : `${selectedMonths.length} month(s) selected`}
                                    </span>
                                    <span className="text-lg font-bold text-primary">
                                      ৳{selectedMonthsTotal.toLocaleString('bn-BD')}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-green-600 dark:text-green-400">
                              ✓ {language === 'bn' ? 'এই সদস্যের কোনো বকেয়া নেই' : 'No unpaid dues for this member'}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {formData.type === 'donation' && (
                    <>
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'দাতার নাম' : 'Donor Name'}</Label>
                        <Input
                          value={formData.donor_name}
                          onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'দাতার ফোন' : 'Donor Phone'}</Label>
                        <Input
                          value={formData.donor_phone}
                          onChange={(e) => setFormData({ ...formData, donor_phone: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'ট্রানজেকশন আইডি' : 'Transaction ID'}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.payment_reference}
                        readOnly
                        className="bg-muted font-mono"
                      />
                      {!editingTransaction && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, payment_reference: generateTransactionId() })}
                        >
                          {language === 'bn' ? 'নতুন' : 'New'}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'bn' ? 'স্বয়ংক্রিয়ভাবে তৈরি হয়েছে' : 'Auto-generated'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'বিবরণ (বাংলা)' : 'Description (Bengali)'}</Label>
                  <Input
                    value={formData.description_bn}
                    onChange={(e) => setFormData({ ...formData, description_bn: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'বিবরণ (English)' : 'Description (English)'}</Label>
                  <Input
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'নোট' : 'Notes'}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingTransaction
                      ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
                      : (language === 'bn' ? 'যোগ করুন' : 'Add')
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'bn' ? 'মোট আয়' : 'Total Income'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">৳{totalIncome.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'bn' ? 'মোট খরচ' : 'Total Expense'}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">৳{totalExpense.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'bn' ? 'ব্যালেন্স' : 'Balance'}
              </CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ৳{balance.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'bn' ? 'মোট লেনদেন' : 'Total Transactions'}
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'bn' ? 'খুঁজুন...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={language === 'bn' ? 'ধরন ফিল্টার' : 'Filter by type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'bn' ? 'সব' : 'All'}</SelectItem>
              {transactionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {language === 'bn' ? type.label_bn : type.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ধরন' : 'Type'}</TableHead>
                    <TableHead>{language === 'bn' ? 'বিবরণ' : 'Description'}</TableHead>
                    <TableHead>{language === 'bn' ? 'পদ্ধতি' : 'Method'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {language === 'bn' ? 'কোন লেনদেন পাওয়া যায়নি' : 'No transactions found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions?.map((transaction) => {
                      const isIncome = ['member_fee', 'donation', 'event_fee', 'other_income'].includes(transaction.type);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {getTypeLabel(transaction.type)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              {language === 'bn' ? transaction.description_bn : transaction.description_en}
                              {transaction.members?.full_name && (
                                <span className="text-sm text-muted-foreground block">
                                  {transaction.members.full_name}
                                </span>
                              )}
                              {transaction.donor_name && (
                                <span className="text-sm text-muted-foreground block">
                                  {transaction.donor_name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getPaymentLabel(transaction.payment_method || 'cash')}</TableCell>
                          <TableCell className={`text-right font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}৳{Number(transaction.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openPrintDialog(transaction)}
                                title={language === 'bn' ? 'প্রিন্ট' : 'Print'}
                              >
                                <Printer className="h-4 w-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(transaction.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Print Voucher Dialog */}
        <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{language === 'bn' ? 'ভাউচার প্রিভিউ' : 'Voucher Preview'}</span>
                <Button onClick={() => handlePrint()} className="ml-4">
                  <Printer className="h-4 w-4 mr-2" />
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
