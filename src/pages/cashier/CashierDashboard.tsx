import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wallet, Receipt, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { format } from 'date-fns';

const CashierDashboard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [cashierName, setCashierName] = useState('');

  // Fetch cashier info
  useEffect(() => {
    const fetchCashierInfo = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('cashiers')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setCashierName(data.full_name);
      }
    };

    fetchCashierInfo();
  }, [user]);

  // Fetch transactions summary
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['cashier-transactions-summary'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0]);

      if (error) throw error;
      return data;
    },
  });

  // Fetch unpaid dues count
  const { data: unpaidDues, isLoading: duesLoading } = useQuery({
    queryKey: ['cashier-unpaid-dues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_dues')
        .select('id, amount')
        .eq('is_paid', false);

      if (error) throw error;
      return data;
    },
  });

  // Fetch members count
  const { data: membersCount, isLoading: membersLoading } = useQuery({
    queryKey: ['cashier-members-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      if (error) throw error;
      return count || 0;
    },
  });

  // Calculate totals
  const monthlyIncome = transactions?.filter(t => 
    ['member_fee', 'donation', 'event_fee', 'other_income'].includes(t.type)
  ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const monthlyExpense = transactions?.filter(t => 
    ['expense', 'other_expense'].includes(t.type)
  ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalUnpaidAmount = unpaidDues?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

  const isLoading = transactionsLoading || duesLoading || membersLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
          {language === 'bn' ? 'ক্যাশিয়ার ড্যাশবোর্ড' : 'Cashier Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'bn' 
            ? `স্বাগতম, ${cashierName || 'ক্যাশিয়ার'}` 
            : `Welcome, ${cashierName || 'Cashier'}`}
        </p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), 'dd MMMM, yyyy')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'এই মাসের আয়' : 'Monthly Income'}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-green-600">
                      ৳{monthlyIncome.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'এই মাসের ব্যয়' : 'Monthly Expense'}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-red-600">
                      ৳{monthlyExpense.toLocaleString()}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'বকেয়া চাঁদা' : 'Unpaid Dues'}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-amber-600">
                      ৳{totalUnpaidAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {unpaidDues?.length || 0} {language === 'bn' ? 'টি বাকি' : 'pending'}
                    </p>
                  </div>
                  <Receipt className="w-8 h-8 text-amber-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'মোট সদস্য' : 'Total Members'}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-blue-600">
                      {membersCount}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Balance Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'এই মাসের ব্যালেন্স' : 'Monthly Balance'}
                  </p>
                  <p className={`text-3xl font-bold ${(monthlyIncome - monthlyExpense) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ৳{(monthlyIncome - monthlyExpense).toLocaleString()}
                  </p>
                </div>
                <Wallet className="w-12 h-12 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'bn' ? 'দ্রুত অ্যাকশন' : 'Quick Actions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a 
                  href="/cashier/finance" 
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-center"
                >
                  <Wallet className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">
                    {language === 'bn' ? 'নতুন লেনদেন' : 'New Transaction'}
                  </p>
                </a>
                <a 
                  href="/cashier/dues" 
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-center"
                >
                  <Receipt className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="font-medium">
                    {language === 'bn' ? 'বকেয়া দেখুন' : 'View Dues'}
                  </p>
                </a>
                <a 
                  href="/cashier/yearly-accounts" 
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-center"
                >
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium">
                    {language === 'bn' ? 'বার্ষিক রিপোর্ট' : 'Yearly Report'}
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CashierDashboard;
