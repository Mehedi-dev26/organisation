import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDue, setSelectedDue] = useState<DueWithStatus | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    mutationFn: async ({ dueId, txnId }: { dueId: string; txnId: string }) => {
      const { error } = await supabase
        .from('member_dues')
        .update({
          transaction_id: txnId,
          payment_status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', dueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-dues-pay'] });
      setIsDialogOpen(false);
      setTransactionId('');
      setSelectedDue(null);
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

  const handlePayNow = (due: DueWithStatus) => {
    setSelectedDue(due);
    setTransactionId('');
    setIsDialogOpen(true);
  };

  const handleSubmitPayment = () => {
    if (!transactionId.trim()) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ট্রানজেকশন আইডি দিন' : 'Please enter Transaction ID',
        variant: 'destructive',
      });
      return;
    }

    if (selectedDue) {
      submitPaymentMutation.mutate({ dueId: selectedDue.id, txnId: transactionId.trim() });
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bkash':
      case 'nagad':
      case 'rocket':
        return <Smartphone className="w-6 h-6" />;
      case 'bank':
        return <Building2 className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'bkash':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'nagad':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'rocket':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'bank':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
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

  const unpaidDues = duesData?.filter(d => !d.is_paid) || [];
  const submittedDues = duesData?.filter(d => d.payment_status === 'submitted') || [];

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
        {/* Payment Methods */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              {language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Methods'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' 
                ? 'নিচের যেকোনো মাধ্যমে টাকা পাঠান এবং ট্রানজেকশন আইডি সংরক্ষণ করুন' 
                : 'Send money using any of the methods below and save the Transaction ID'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {paymentMethods?.map((method) => (
                <div 
                  key={method.id}
                  className={`p-4 rounded-xl border-2 ${getMethodColor(method.method_type)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getMethodColor(method.method_type)}`}>
                        {getMethodIcon(method.method_type)}
                      </div>
                      <div>
                        <h3 className="font-bold capitalize text-lg">{method.method_type}</h3>
                        <p className="text-sm text-muted-foreground">{method.account_name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {method.method_type === 'bank' 
                          ? (language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number')
                          : (language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number')
                        }
                      </p>
                      <p className="font-mono font-bold text-lg">{method.account_number}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyNumber(method.account_number, method.id)}
                      className="h-9"
                    >
                      {copiedId === method.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {method.branch_name && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {language === 'bn' ? 'শাখা:' : 'Branch:'} {method.branch_name}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    {language === 'bn' ? method.instructions_bn : method.instructions_en}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Verifications */}
        {submittedDues.length > 0 && (
          <Card className="border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Clock className="w-5 h-5" />
                {language === 'bn' ? 'অনুমোদনের অপেক্ষায়' : 'Awaiting Approval'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'এই পেমেন্টগুলো যাচাইয়ের জন্য অপেক্ষমাণ' 
                  : 'These payments are pending verification'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submittedDues.map((due) => (
                  <div 
                    key={due.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{due.month_year}</p>
                      <p className="text-sm text-muted-foreground">
                        TxnID: {due.transaction_id}
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

        {/* Unpaid Dues */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-500/5 to-red-500/10 border-b">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              {language === 'bn' ? 'বকেয়া চাঁদা' : 'Unpaid Dues'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' 
                ? 'পরিশোধ করতে "এখনই পরিশোধ করুন" বাটনে ক্লিক করুন' 
                : 'Click "Pay Now" to submit your payment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {unpaidDues.filter(d => d.payment_status !== 'submitted').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">
                  {language === 'bn' ? 'কোন বকেয়া চাঁদা নেই!' : 'No unpaid dues!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {unpaidDues
                  .filter(d => d.payment_status !== 'submitted')
                  .map((due) => (
                  <div 
                    key={due.id}
                    className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
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
                      <Button 
                        onClick={() => handlePayNow(due)}
                        className="bg-gradient-to-r from-primary to-primary/80"
                      >
                        {language === 'bn' ? 'পরিশোধ করুন' : 'Pay Now'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Dues History */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>{language === 'bn' ? 'চাঁদার ইতিহাস' : 'Payment History'}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {duesData?.map((due) => (
                <div 
                  key={due.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{due.month_year}</span>
                    {due.transaction_id && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ({due.transaction_id})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">৳{due.amount}</span>
                    {getStatusBadge(due)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'bn' ? 'পেমেন্ট তথ্য জমা দিন' : 'Submit Payment Information'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' 
                ? `${selectedDue?.month_year} মাসের ৳${selectedDue?.amount} চাঁদার জন্য`
                : `For ${selectedDue?.month_year} dues of ৳${selectedDue?.amount}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">
                {language === 'bn' 
                  ? '১. উপরের যেকোনো মাধ্যমে টাকা পাঠান'
                  : '1. Send money using any method above'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? '২. প্রাপ্ত ট্রানজেকশন আইডি নিচে লিখুন'
                  : '2. Enter the received Transaction ID below'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="txn-id">
                {language === 'bn' ? 'ট্রানজেকশন আইডি' : 'Transaction ID'}
              </Label>
              <Input
                id="txn-id"
                placeholder={language === 'bn' ? 'যেমন: TXN123456789' : 'e.g., TXN123456789'}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSubmitPayment}
              disabled={submitPaymentMutation.isPending}
            >
              {submitPaymentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {language === 'bn' ? 'জমা দিন' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayDues;
