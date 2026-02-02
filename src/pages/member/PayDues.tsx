import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CreditCard, 
  ArrowLeft, 
  Smartphone, 
  Building2, 
  Copy, 
  Check,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Zap
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

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

interface DueWithStatus {
  id: string;
  member_id: string;
  month_year: string;
  amount: number;
  is_paid: boolean;
  paid_date: string | null;
  transaction_id: string | null;
  payment_status: string;
  submitted_at: string | null;
  rejection_reason: string | null;
}

const PayDues = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDue, setSelectedDue] = useState<DueWithStatus | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'manual' | 'piprapay'>('piprapay');
  const [isProcessingPipraPay, setIsProcessingPipraPay] = useState(false);

  // Check for payment status in URL
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'cancelled') {
      toast({
        title: language === 'bn' ? 'পেমেন্ট বাতিল' : 'Payment Cancelled',
        description: language === 'bn' ? 'পেমেন্ট বাতিল করা হয়েছে' : 'Payment was cancelled',
        variant: 'destructive',
      });
    }
  }, [searchParams, language, toast]);

  // Real-time subscription
  useRealtimeSubscription({ table: 'member_dues', queryKey: ['member-dues-pay'] });

  // Fetch member data
  const { data: memberData } = useQuery({
    queryKey: ['member-profile-pay', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, member_id, full_name')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch payment methods
  const { data: paymentMethods, isLoading: methodsLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  // Fetch member dues
  const { data: duesData, isLoading: duesLoading } = useQuery({
    queryKey: ['member-dues-pay', memberData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_dues')
        .select('*')
        .eq('member_id', memberData?.id)
        .order('month_year', { ascending: false });
      
      if (error) throw error;
      return data as DueWithStatus[];
    },
    enabled: !!memberData?.id,
  });

  // Submit payment mutation
  const submitPaymentMutation = useMutation({
    mutationFn: async ({ dueId, txnId, paymentMethod }: { dueId: string; txnId: string; paymentMethod: string }) => {
      const { error } = await supabase
        .from('member_dues')
        .update({
          transaction_id: txnId,
          payment_method: paymentMethod,
          payment_status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', dueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-dues-pay'] });
      setTransactionId('');
      setSelectedDue(null);
      setSelectedPaymentMethod('');
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? 'আপনার পেমেন্ট তথ্য জমা দেওয়া হয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।' 
          : 'Your payment information has been submitted. Please wait for approval.',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCopyNumber = (number: string, id: string) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: language === 'bn' ? 'কপি হয়েছে!' : 'Copied!',
      description: number,
    });
  };

  const handleSelectDue = (due: DueWithStatus) => {
    setSelectedDue(due);
    setTransactionId('');
    setSelectedPaymentMethod('');
    setPaymentMode('piprapay');
  };

  // PipraPay payment handler
  const handlePipraPay = async () => {
    if (!selectedDue || !memberData) return;
    
    setIsProcessingPipraPay(true);
    try {
      const response = await supabase.functions.invoke('pirapay-initiate', {
        body: {
          due_id: selectedDue.id,
          member_id: memberData.id,
          amount: selectedDue.amount,
          month_year: selectedDue.month_year,
          member_name: memberData.full_name,
          member_email: user?.email || '',
          member_phone: '',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (data.success && data.payment_url) {
        // Redirect to PipraPay payment page
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.error || 'Failed to initiate payment');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed';
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessingPipraPay(false);
    }
  };

  const handleSubmitPayment = () => {
    if (!selectedPaymentMethod) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পেমেন্ট মাধ্যম নির্বাচন করুন' : 'Please select a payment method',
        variant: 'destructive',
      });
      return;
    }

    if (!transactionId.trim()) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ট্রানজেকশন আইডি দিন' : 'Please enter Transaction ID',
        variant: 'destructive',
      });
      return;
    }

    if (selectedDue) {
      submitPaymentMutation.mutate({ 
        dueId: selectedDue.id, 
        txnId: transactionId.trim(), 
        paymentMethod: selectedPaymentMethod 
      });
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bkash':
      case 'nagad':
      case 'rocket':
        return <Smartphone className="w-5 h-5" />;
      case 'bank':
        return <Building2 className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'bkash':
        return 'border-pink-500 bg-pink-500/10 text-pink-600';
      case 'nagad':
        return 'border-orange-500 bg-orange-500/10 text-orange-600';
      case 'rocket':
        return 'border-purple-500 bg-purple-500/10 text-purple-600';
      case 'bank':
        return 'border-blue-500 bg-blue-500/10 text-blue-600';
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-600';
    }
  };

  const getMethodBgColor = (type: string) => {
    switch (type) {
      case 'bkash':
        return 'bg-gradient-to-br from-pink-500 to-pink-600';
      case 'nagad':
        return 'bg-gradient-to-br from-orange-500 to-orange-600';
      case 'rocket':
        return 'bg-gradient-to-br from-purple-500 to-purple-600';
      case 'bank':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  const getStatusBadge = (due: DueWithStatus) => {
    if (due.is_paid) {
      return (
        <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
        </Badge>
      );
    }
    
    switch (due.payment_status) {
      case 'submitted':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-700 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            {language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            {language === 'bn' ? 'বকেয়া' : 'Unpaid'}
          </Badge>
        );
    }
  };

  const selectedMethod = paymentMethods?.find(m => m.method_type === selectedPaymentMethod);
  const unpaidDues = duesData?.filter(d => !d.is_paid && d.payment_status !== 'submitted' && d.payment_status !== 'piprapay_pending') || [];
  const submittedDues = duesData?.filter(d => d.payment_status === 'submitted' || d.payment_status === 'piprapay_pending') || [];
  const paidDues = duesData?.filter(d => d.is_paid) || [];

  if (methodsLoading || duesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/90 to-primary sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/member-dashboard')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg text-white">
                {language === 'bn' ? 'চাঁদা পরিশোধ' : 'Pay Dues'}
              </h1>
              <p className="text-white/70 text-sm">
                {language === 'bn' ? 'বিকাশ, নগদ বা ব্যাংকে পাঠান' : 'Send via bKash, Nagad or Bank'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Pending Verifications Alert */}
        {submittedDues.length > 0 && (
          <Card className="border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-yellow-700 text-base">
                <Clock className="w-5 h-5" />
                {language === 'bn' ? 'অনুমোদনের অপেক্ষায়' : 'Awaiting Approval'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {submittedDues.map((due) => (
                  <div 
                    key={due.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{due.month_year}</p>
                      <p className="text-xs text-muted-foreground">
                        TxnID: <span className="font-mono">{due.transaction_id}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">৳{due.amount}</p>
                      {getStatusBadge(due)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Select Due to Pay */}
        {unpaidDues.length > 0 && !selectedDue && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-500/5 to-red-500/10 border-b">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                {language === 'bn' ? 'বকেয়া চাঁদা নির্বাচন করুন' : 'Select Due to Pay'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'যে মাসের চাঁদা পরিশোধ করতে চান সেটি নির্বাচন করুন' 
                  : 'Select the month you want to pay for'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {unpaidDues.map((due) => (
                  <div 
                    key={due.id}
                    className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectDue(due)}
                  >
                    <div>
                      <p className="font-medium">{due.month_year}</p>
                      {due.payment_status === 'rejected' && due.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">
                          {language === 'bn' ? 'কারণ:' : 'Reason:'} {due.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-lg">৳{due.amount}</p>
                        {getStatusBadge(due)}
                      </div>
                      <Button className="bg-gradient-to-r from-primary to-primary/80">
                        {language === 'bn' ? 'নির্বাচন করুন' : 'Select'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Unpaid Dues */}
        {unpaidDues.length === 0 && !selectedDue && (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="font-medium text-lg">
                  {language === 'bn' ? 'কোন বকেয়া চাঁদা নেই!' : 'No unpaid dues!'}
                </p>
                <p className="text-sm mt-2">
                  {language === 'bn' ? 'আপনার সকল চাঁদা পরিশোধিত বা অনুমোদনের অপেক্ষায়' : 'All your dues are paid or pending approval'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Form - Shows when a due is selected */}
        {selectedDue && (
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    {language === 'bn' ? 'পেমেন্ট করুন' : 'Make Payment'}
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {language === 'bn' ? 'মাস:' : 'Month:'} {selectedDue.month_year}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</p>
                  <p className="text-2xl font-bold">৳{selectedDue.amount}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Payment Mode Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">১</div>
                  <Label className="text-lg font-semibold">
                    {language === 'bn' ? 'পেমেন্ট পদ্ধতি নির্বাচন করুন' : 'Select Payment Mode'}
                  </Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* PipraPay Option */}
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMode === 'piprapay'
                        ? 'border-green-500 bg-green-500/10 ring-2 ring-offset-2 ring-green-500'
                        : 'border-muted bg-card hover:bg-muted/50'
                    }`}
                    onClick={() => setPaymentMode('piprapay')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white mb-2">
                        <Zap className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-green-700">
                        {language === 'bn' ? 'অটো পেমেন্ট' : 'Auto Payment'}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {language === 'bn' ? 'বিকাশ/নগদ দিয়ে সরাসরি' : 'Direct via bKash/Nagad'}
                      </span>
                    </div>
                  </div>

                  {/* Manual Option */}
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMode === 'manual'
                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-offset-2 ring-blue-500'
                        : 'border-muted bg-card hover:bg-muted/50'
                    }`}
                    onClick={() => setPaymentMode('manual')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white mb-2">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-blue-700">
                        {language === 'bn' ? 'ম্যানুয়াল পেমেন্ট' : 'Manual Payment'}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {language === 'bn' ? 'ট্রানজেকশন আইডি জমা দিন' : 'Submit Transaction ID'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PipraPay Quick Payment */}
              {paymentMode === 'piprapay' && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-green-50 dark:bg-green-950/30 p-5 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white flex-shrink-0">
                        <Zap className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-green-700 mb-2">
                          {language === 'bn' ? 'দ্রুত ও স্বয়ংক্রিয় পেমেন্ট' : 'Quick & Automatic Payment'}
                        </h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>✓ {language === 'bn' ? 'বিকাশ/নগদ দিয়ে সরাসরি পরিশোধ করুন' : 'Pay directly via bKash/Nagad'}</li>
                          <li>✓ {language === 'bn' ? 'পেমেন্ট সফল হলে স্বয়ংক্রিয়ভাবে আপডেট হবে' : 'Auto-updates on successful payment'}</li>
                          <li>✓ {language === 'bn' ? 'কোন ম্যানুয়াল যাচাই প্রয়োজন নেই' : 'No manual verification needed'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    onClick={handlePipraPay}
                    disabled={isProcessingPipraPay}
                  >
                    {isProcessingPipraPay ? (
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    ) : (
                      <Zap className="w-6 h-6 mr-2" />
                    )}
                    {language === 'bn' ? `৳${selectedDue.amount} পরিশোধ করুন` : `Pay ৳${selectedDue.amount}`}
                  </Button>
                </div>
              )}

              {/* Manual Payment - Step 1: Select Payment Method */}
              {paymentMode === 'manual' && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">২</div>
                    <Label className="text-lg font-semibold">
                      {language === 'bn' ? 'পেমেন্ট মাধ্যম নির্বাচন করুন' : 'Select Payment Method'}
                    </Label>
                  </div>
                  
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    {paymentMethods?.map((method) => (
                      <div key={method.id}>
                        <RadioGroupItem
                          value={method.method_type}
                          id={method.method_type}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={method.method_type}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                            ${selectedPaymentMethod === method.method_type 
                              ? `${getMethodColor(method.method_type)} border-2 ring-2 ring-offset-2 ring-current` 
                              : 'border-muted bg-card hover:bg-muted/50'
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white mb-2 ${getMethodBgColor(method.method_type)}`}>
                            {getMethodIcon(method.method_type)}
                          </div>
                          <span className="font-semibold capitalize">{method.method_type}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 2: Show Payment Details - Manual Mode */}
              {paymentMode === 'manual' && selectedMethod && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">৩</div>
                    <Label className="text-lg font-semibold">
                      {language === 'bn' ? 'টাকা পাঠান' : 'Send Money'}
                    </Label>
                  </div>

                  <div className={`p-5 rounded-xl border-2 ${getMethodColor(selectedMethod.method_type)}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getMethodBgColor(selectedMethod.method_type)}`}>
                        {getMethodIcon(selectedMethod.method_type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg capitalize">{selectedMethod.method_type}</h3>
                        <p className="text-sm text-muted-foreground">{selectedMethod.account_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-background/80 rounded-lg p-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {selectedMethod.method_type === 'bank' 
                            ? (language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number')
                            : (language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number')
                          }
                        </p>
                        <p className="font-mono font-bold text-xl">{selectedMethod.account_number}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyNumber(selectedMethod.account_number, selectedMethod.id)}
                        className="h-10"
                      >
                        {copiedId === selectedMethod.id ? (
                          <>
                            <Check className="w-4 h-4 mr-1 text-green-600" />
                            {language === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            {language === 'bn' ? 'কপি' : 'Copy'}
                          </>
                        )}
                      </Button>
                    </div>

                    {selectedMethod.branch_name && (
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">{language === 'bn' ? 'শাখা:' : 'Branch:'}</span> {selectedMethod.branch_name}
                      </p>
                    )}

                    {selectedMethod.routing_number && (
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">{language === 'bn' ? 'রাউটিং নম্বর:' : 'Routing:'}</span> {selectedMethod.routing_number}
                      </p>
                    )}

                    <div className="mt-4 p-3 bg-background/50 rounded-lg border border-dashed">
                      <p className="text-sm italic text-muted-foreground">
                        💡 {language === 'bn' ? selectedMethod.instructions_bn : selectedMethod.instructions_en}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Enter Transaction ID - Manual Mode */}
              {paymentMode === 'manual' && selectedMethod && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">৪</div>
                    <Label className="text-lg font-semibold">
                      {language === 'bn' ? 'ট্রানজেকশন আইডি দিন' : 'Enter Transaction ID'}
                    </Label>
                  </div>

                  <div className="bg-muted/50 p-5 rounded-xl border">
                    <Label htmlFor="transaction-id" className="text-sm text-muted-foreground mb-2 block">
                      {language === 'bn' 
                        ? 'টাকা পাঠানোর পর প্রাপ্ত ট্রানজেকশন আইডি লিখুন' 
                        : 'Enter the Transaction ID received after sending money'}
                    </Label>
                    <Input
                      id="transaction-id"
                      placeholder={language === 'bn' ? 'উদাহরণ: TXN123456789' : 'Example: TXN123456789'}
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="text-lg font-mono h-12"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button - Only for Manual Mode */}
              {paymentMode === 'manual' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDue(null);
                      setSelectedPaymentMethod('');
                      setTransactionId('');
                    }}
                  >
                    {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white h-12 text-lg"
                    onClick={handleSubmitPayment}
                    disabled={!selectedPaymentMethod || !transactionId.trim() || submitPaymentMutation.isPending}
                  >
                    {submitPaymentMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    {language === 'bn' ? 'জমা দিন' : 'Submit'}
                  </Button>
                </div>
              )}

              {/* Cancel Button - For PipraPay Mode */}
              {paymentMode === 'piprapay' && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedDue(null);
                      setSelectedPaymentMethod('');
                      setTransactionId('');
                    }}
                  >
                    {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {paidDues.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {language === 'bn' ? 'পরিশোধিত চাঁদা' : 'Paid Dues'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {paidDues.slice(0, 10).map((due) => (
                  <div 
                    key={due.id}
                    className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div>
                      <p className="font-medium">{due.month_year}</p>
                      <p className="text-xs text-muted-foreground">
                        {due.paid_date && new Date(due.paid_date).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">৳{due.amount}</p>
                      {getStatusBadge(due)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PayDues;
