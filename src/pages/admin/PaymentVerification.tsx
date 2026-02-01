import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Eye,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface PendingPayment {
  id: string;
  member_id: string;
  month_year: string;
  amount: number;
  is_paid: boolean;
  transaction_id: string | null;
  payment_status: string;
  submitted_at: string | null;
  rejection_reason: string | null;
  members: {
    id: string;
    member_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

const PaymentVerification = () => {
  const { language } = useLanguage();
  const { isAdmin, isCashier, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Real-time subscription
  useRealtimeSubscription({ table: 'member_dues', queryKey: ['pending-payments'] });

  // Fetch pending payments
  const { data: pendingPayments = [], isLoading } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_dues')
        .select(`
          *,
          members (
            id,
            member_id,
            full_name,
            email,
            phone
          )
        `)
        .eq('payment_status', 'submitted')
        .eq('is_paid', false)
        .order('submitted_at', { ascending: true });
      
      if (error) throw error;
      return data as PendingPayment[];
    },
    enabled: isAdmin || isCashier,
  });

  // Fetch all payment history (for reference)
  const { data: recentPayments = [] } = useQuery({
    queryKey: ['recent-verified-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_dues')
        .select(`
          *,
          members (
            id,
            member_id,
            full_name,
            email,
            phone
          )
        `)
        .in('payment_status', ['approved', 'rejected'])
        .order('verified_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as PendingPayment[];
    },
    enabled: isAdmin || isCashier,
  });

  // Approve payment mutation
  const approveMutation = useMutation({
    mutationFn: async (payment: PendingPayment) => {
      // First, create a transaction record
      const { data: txnData, error: txnError } = await supabase
        .from('transactions')
        .insert({
          type: 'member_fee',
          amount: payment.amount,
          member_id: payment.member_id,
          month_year: payment.month_year,
          transaction_date: new Date().toISOString().split('T')[0],
          payment_method: 'mobile_banking',
          payment_reference: payment.transaction_id,
          description_bn: `${payment.month_year} মাসের চাঁদা`,
          description_en: `Monthly dues for ${payment.month_year}`,
          created_by: user?.id,
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Then update the dues record
      const { error: duesError } = await supabase
        .from('member_dues')
        .update({
          is_paid: true,
          paid_date: new Date().toISOString().split('T')[0],
          payment_status: 'approved',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          transaction_id: txnData.id,
        })
        .eq('id', payment.id);

      if (duesError) throw duesError;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user?.id || '',
        user_role: isAdmin ? 'admin' : 'cashier',
        action_type: 'payment_approved',
        entity_type: 'member_dues',
        entity_id: payment.id,
        description_bn: `${payment.members?.full_name} এর ${payment.month_year} মাসের চাঁদা অনুমোদিত`,
        description_en: `Approved ${payment.month_year} dues for ${payment.members?.full_name}`,
        metadata: { transaction_id: payment.transaction_id, amount: payment.amount },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['recent-verified-payments'] });
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsApproveDialogOpen(false);
      setSelectedPayment(null);
      toast({
        title: language === 'bn' ? 'অনুমোদিত!' : 'Approved!',
        description: language === 'bn' 
          ? 'পেমেন্ট সফলভাবে অনুমোদিত হয়েছে' 
          : 'Payment has been approved successfully',
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

  // Reject payment mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ payment, reason }: { payment: PendingPayment; reason: string }) => {
      const { error } = await supabase
        .from('member_dues')
        .update({
          payment_status: 'rejected',
          rejection_reason: reason,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user?.id || '',
        user_role: isAdmin ? 'admin' : 'cashier',
        action_type: 'payment_rejected',
        entity_type: 'member_dues',
        entity_id: payment.id,
        description_bn: `${payment.members?.full_name} এর ${payment.month_year} মাসের চাঁদা প্রত্যাখ্যাত`,
        description_en: `Rejected ${payment.month_year} dues for ${payment.members?.full_name}`,
        metadata: { transaction_id: payment.transaction_id, reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['recent-verified-payments'] });
      setIsRejectDialogOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
      toast({
        title: language === 'bn' ? 'প্রত্যাখ্যাত!' : 'Rejected!',
        description: language === 'bn' 
          ? 'পেমেন্ট প্রত্যাখ্যাত হয়েছে' 
          : 'Payment has been rejected',
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

  // Filter pending payments
  const filteredPayments = pendingPayments.filter(payment => {
    const memberName = payment.members?.full_name?.toLowerCase() || '';
    const memberId = payment.members?.member_id?.toLowerCase() || '';
    const txnId = payment.transaction_id?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return memberName.includes(query) || memberId.includes(query) || txnId.includes(query);
  });

  if (!isAdmin && !isCashier) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          {language === 'bn' ? 'এই পেজে প্রবেশের অনুমতি নেই' : 'Access denied'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'bn' ? 'পেমেন্ট যাচাইকরণ' : 'Payment Verification'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'bn' 
            ? 'সদস্যদের জমা দেওয়া পেমেন্ট যাচাই এবং অনুমোদন করুন' 
            : 'Verify and approve member payment submissions'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
                </p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট অপেক্ষমাণ পরিমাণ' : 'Total Pending Amount'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ৳{pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'সাম্প্রতিক যাচাইকৃত' : 'Recently Verified'}
                </p>
                <p className="text-2xl font-bold text-blue-600">{recentPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            {language === 'bn' ? 'অপেক্ষমাণ পেমেন্ট' : 'Pending Payments'}
          </CardTitle>
          <CardDescription>
            {language === 'bn' 
              ? 'ট্রানজেকশন আইডি যাচাই করে অনুমোদন বা প্রত্যাখ্যান করুন' 
              : 'Verify transaction IDs and approve or reject payments'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={language === 'bn' ? 'সদস্য বা ট্রানজেকশন আইডি খুঁজুন...' : 'Search member or transaction ID...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">
                {language === 'bn' ? 'কোন অপেক্ষমাণ পেমেন্ট নেই!' : 'No pending payments!'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'সদস্য' : 'Member'}</TableHead>
                    <TableHead>{language === 'bn' ? 'মাস' : 'Month'}</TableHead>
                    <TableHead>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ট্রানজেকশন আইডি' : 'Transaction ID'}</TableHead>
                    <TableHead>{language === 'bn' ? 'জমার তারিখ' : 'Submitted'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.members?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{payment.members?.member_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{payment.month_year}</TableCell>
                      <TableCell className="font-bold">৳{payment.amount}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {payment.transaction_id}
                        </code>
                      </TableCell>
                      <TableCell>
                        {payment.submitted_at 
                          ? format(new Date(payment.submitted_at), 'dd/MM/yyyy HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsApproveDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Verified Payments */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {language === 'bn' ? 'সাম্প্রতিক যাচাইকৃত' : 'Recently Verified'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'সদস্য' : 'Member'}</TableHead>
                    <TableHead>{language === 'bn' ? 'মাস' : 'Month'}</TableHead>
                    <TableHead>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.members?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{payment.members?.member_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{payment.month_year}</TableCell>
                      <TableCell className="font-bold">৳{payment.amount}</TableCell>
                      <TableCell>
                        {payment.payment_status === 'approved' ? (
                          <Badge className="bg-green-500/20 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            {language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              {language === 'bn' ? 'পেমেন্ট অনুমোদন' : 'Approve Payment'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' 
                ? 'এই পেমেন্ট অনুমোদন করতে নিশ্চিত করুন' 
                : 'Confirm to approve this payment'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'সদস্য:' : 'Member:'}</span>
                  <span className="font-medium">{selectedPayment.members?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'মাস:' : 'Month:'}</span>
                  <span className="font-medium">{selectedPayment.month_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'পরিমাণ:' : 'Amount:'}</span>
                  <span className="font-bold text-lg">৳{selectedPayment.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'ট্রানজেকশন আইডি:' : 'Transaction ID:'}</span>
                  <code className="bg-background px-2 py-1 rounded">{selectedPayment.transaction_id}</code>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  {language === 'bn' 
                    ? '⚠️ অনুমোদন করার আগে ট্রানজেকশন আইডি যাচাই করুন'
                    : '⚠️ Please verify the transaction ID before approving'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedPayment && approveMutation.mutate(selectedPayment)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {language === 'bn' ? 'অনুমোদন করুন' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {language === 'bn' ? 'পেমেন্ট প্রত্যাখ্যান' : 'Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' 
                ? 'কারণ উল্লেখ করে পেমেন্ট প্রত্যাখ্যান করুন' 
                : 'Provide a reason for rejecting this payment'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'সদস্য:' : 'Member:'}</span>
                  <span className="font-medium">{selectedPayment.members?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'bn' ? 'ট্রানজেকশন আইডি:' : 'Transaction ID:'}</span>
                  <code className="bg-background px-2 py-1 rounded">{selectedPayment.transaction_id}</code>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  {language === 'bn' ? 'প্রত্যাখ্যানের কারণ' : 'Rejection Reason'}
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder={language === 'bn' 
                    ? 'যেমন: ট্রানজেকশন আইডি ভুল, টাকা পাওয়া যায়নি ইত্যাদি'
                    : 'e.g., Invalid transaction ID, payment not received, etc.'}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedPayment && rejectMutation.mutate({ 
                payment: selectedPayment, 
                reason: rejectionReason 
              })}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {language === 'bn' ? 'প্রত্যাখ্যান করুন' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentVerification;
