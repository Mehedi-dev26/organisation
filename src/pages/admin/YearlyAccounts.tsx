import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid, Tooltip } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Wallet, FileText, Download, ArrowUpRight, ArrowDownRight, Scale, Edit, Trash2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type TransactionType = Database['public']['Enums']['transaction_type'];

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  description_bn: string | null;
  description_en: string | null;
  notes: string | null;
  payment_method: string | null;
  receipt_number: string | null;
  member_id: string | null;
  donor_name: string | null;
}

const YearlyAccounts = () => {
  const { language } = useLanguage();
  const { isAdmin, isCashier, user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Generate years from 2020 to current year
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => (currentYear - i).toString());

  // Fetch transactions for the selected year
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['yearly-transactions', selectedYear],
    queryFn: async () => {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin || isCashier,
  });

  // Calculate yearly summary
  const yearlySummary = React.useMemo(() => {
    const incomeTypes = ['member_fee', 'donation', 'event_income', 'other_income'];
    
    const totalIncome = transactions
      .filter(t => incomeTypes.includes(t.type))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpense = transactions
      .filter(t => !incomeTypes.includes(t.type))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length
    };
  }, [transactions]);

  // Calculate monthly breakdown
  const monthlyData = React.useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: format(new Date(2024, i, 1), 'MMM', { locale: language === 'bn' ? bn : enUS }),
      income: 0,
      expense: 0,
    }));

    const incomeTypes = ['member_fee', 'donation', 'event_income', 'other_income'];

    transactions.forEach(t => {
      const month = new Date(t.transaction_date).getMonth();
      if (incomeTypes.includes(t.type)) {
        months[month].income += Number(t.amount);
      } else {
        months[month].expense += Number(t.amount);
      }
    });

    return months;
  }, [transactions, language]);

  // Calculate category breakdown
  const categoryData = React.useMemo(() => {
    const categories: { [key: string]: { income: number; expense: number } } = {};
    
    const typeLabels: { [key: string]: { bn: string; en: string; isIncome: boolean } } = {
      member_fee: { bn: 'সদস্য চাঁদা', en: 'Member Fee', isIncome: true },
      donation: { bn: 'দান/অনুদান', en: 'Donation', isIncome: true },
      event_income: { bn: 'অনুষ্ঠান আয়', en: 'Event Income', isIncome: true },
      other_income: { bn: 'অন্যান্য আয়', en: 'Other Income', isIncome: true },
      event_expense: { bn: 'অনুষ্ঠান ব্যয়', en: 'Event Expense', isIncome: false },
      office_expense: { bn: 'অফিস ব্যয়', en: 'Office Expense', isIncome: false },
      utility_expense: { bn: 'ইউটিলিটি বিল', en: 'Utility Bill', isIncome: false },
      welfare_expense: { bn: 'কল্যাণ ব্যয়', en: 'Welfare Expense', isIncome: false },
      other_expense: { bn: 'অন্যান্য ব্যয়', en: 'Other Expense', isIncome: false },
    };

    transactions.forEach(t => {
      const label = typeLabels[t.type]?.[language === 'bn' ? 'bn' : 'en'] || t.type;
      const isIncome = typeLabels[t.type]?.isIncome ?? false;
      
      if (!categories[label]) {
        categories[label] = { income: 0, expense: 0 };
      }
      
      if (isIncome) {
        categories[label].income += Number(t.amount);
      } else {
        categories[label].expense += Number(t.amount);
      }
    });

    return Object.entries(categories).map(([name, values]) => ({
      name,
      value: values.income > 0 ? values.income : values.expense,
      type: values.income > 0 ? 'income' : 'expense'
    }));
  }, [transactions, language]);

  // Colors for pie chart
  const INCOME_COLORS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'];
  const EXPENSE_COLORS = ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2'];

  const incomeCategories = categoryData.filter(c => c.type === 'income');
  const expenseCategories = categoryData.filter(c => c.type === 'expense');

  // Chart config
  const chartConfig = {
    income: {
      label: language === 'bn' ? 'আয়' : 'Income',
      color: 'hsl(var(--chart-1))',
    },
    expense: {
      label: language === 'bn' ? 'ব্যয়' : 'Expense',
      color: 'hsl(var(--chart-2))',
    },
  };

  if (!isAdmin && !isCashier) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          {language === 'bn' ? 'আপনার অ্যাক্সেস নেই' : 'You do not have access'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            {language === 'bn' ? 'বিগত বছরের হিসাব' : 'Yearly Accounts'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' 
              ? 'বার্ষিক আয়-ব্যয়ের বিস্তারিত প্রতিবেদন' 
              : 'Detailed annual income and expense report'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year} {language === 'bn' ? 'সাল' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === 'bn' ? 'রিপোর্ট' : 'Report'}
            </span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট আয়' : 'Total Income'}
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  ৳{yearlySummary.totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট ব্যয়' : 'Total Expense'}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  ৳{yearlySummary.totalExpense.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${yearlySummary.balance >= 0 ? 'from-blue-500/10 to-blue-500/5 border-blue-500/20' : 'from-orange-500/10 to-orange-500/5 border-orange-500/20'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'উদ্বৃত্ত/ঘাটতি' : 'Balance'}
                </p>
                <p className={`text-2xl font-bold ${yearlySummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  ৳{Math.abs(yearlySummary.balance).toLocaleString()}
                  {yearlySummary.balance < 0 && ' (-)'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${yearlySummary.balance >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                <Scale className={`w-6 h-6 ${yearlySummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট লেনদেন' : 'Total Transactions'}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {yearlySummary.transactionCount}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-grid">
          <TabsTrigger value="overview">
            {language === 'bn' ? 'সারাংশ' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="monthly">
            {language === 'bn' ? 'মাসিক' : 'Monthly'}
          </TabsTrigger>
          <TabsTrigger value="category">
            {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
          </TabsTrigger>
          <TabsTrigger value="transactions">
            {language === 'bn' ? 'লেনদেন সম্পাদনা' : 'Edit Transactions'}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'bn' ? 'মাসওয়ারি আয়-ব্যয় তুলনা' : 'Monthly Income vs Expense'}
                </CardTitle>
                <CardDescription>
                  {selectedYear} {language === 'bn' ? 'সালের মাসওয়ারি তুলনামূলক চিত্র' : 'monthly comparison'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="monthName" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="income" name={language === 'bn' ? 'আয়' : 'Income'} fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name={language === 'bn' ? 'ব্যয়' : 'Expense'} fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Trend Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'bn' ? 'আয়-ব্যয় ট্রেন্ড' : 'Income-Expense Trend'}
                </CardTitle>
                <CardDescription>
                  {language === 'bn' ? 'বছরজুড়ে ট্রেন্ড বিশ্লেষণ' : 'Year-round trend analysis'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="monthName" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="income" name={language === 'bn' ? 'আয়' : 'Income'} stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                    <Line type="monotone" dataKey="expense" name={language === 'bn' ? 'ব্যয়' : 'Expense'} stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly Tab */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'bn' ? 'মাসওয়ারি বিস্তারিত হিসাব' : 'Monthly Detailed Accounts'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'মাস' : 'Month'}</TableHead>
                    <TableHead className="text-right text-emerald-600">
                      {language === 'bn' ? 'আয়' : 'Income'}
                    </TableHead>
                    <TableHead className="text-right text-red-600">
                      {language === 'bn' ? 'ব্যয়' : 'Expense'}
                    </TableHead>
                    <TableHead className="text-right">
                      {language === 'bn' ? 'উদ্বৃত্ত' : 'Balance'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((month, index) => {
                    const balance = month.income - month.expense;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {format(new Date(parseInt(selectedYear), month.month - 1, 1), 'MMMM yyyy', { locale: language === 'bn' ? bn : enUS })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <ArrowUpRight className="w-3 h-3" />
                            ৳{month.income.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <ArrowDownRight className="w-3 h-3" />
                            ৳{month.expense.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          ৳{Math.abs(balance).toLocaleString()} {balance < 0 && '(-)'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Total Row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>{language === 'bn' ? 'মোট' : 'Total'}</TableCell>
                    <TableCell className="text-right text-emerald-600">
                      ৳{yearlySummary.totalIncome.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      ৳{yearlySummary.totalExpense.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-right ${yearlySummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      ৳{Math.abs(yearlySummary.balance).toLocaleString()} {yearlySummary.balance < 0 && '(-)'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Tab */}
        <TabsContent value="category" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Income by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী আয়' : 'Income by Category'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incomeCategories.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={incomeCategories}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {incomeCategories.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `৳${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {incomeCategories.map((cat, index) => (
                        <div key={cat.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length] }}
                            />
                            <span className="text-sm">{cat.name}</span>
                          </div>
                          <span className="text-sm font-medium">৳{cat.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {language === 'bn' ? 'কোনো আয় নেই' : 'No income data'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Expense by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী ব্যয়' : 'Expense by Category'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenseCategories.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseCategories}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {expenseCategories.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `৳${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {expenseCategories.map((cat, index) => (
                        <div key={cat.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                            />
                            <span className="text-sm">{cat.name}</span>
                          </div>
                          <span className="text-sm font-medium">৳{cat.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {language === 'bn' ? 'কোনো ব্যয় নেই' : 'No expense data'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Edit Tab */}
        <TransactionsEditTab 
          transactions={transactions}
          language={language}
          selectedYear={selectedYear}
          isAdmin={isAdmin}
          editingTransaction={editingTransaction}
          setEditingTransaction={setEditingTransaction}
          isEditDialogOpen={isEditDialogOpen}
          setIsEditDialogOpen={setIsEditDialogOpen}
          queryClient={queryClient}
          user={user}
        />
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

// Transactions Edit Tab Component
interface TransactionsEditTabProps {
  transactions: Transaction[];
  language: string;
  selectedYear: string;
  isAdmin: boolean;
  editingTransaction: Transaction | null;
  setEditingTransaction: (t: Transaction | null) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  user: any;
}

const TransactionsEditTab: React.FC<TransactionsEditTabProps> = ({
  transactions,
  language,
  selectedYear,
  isAdmin,
  editingTransaction,
  setEditingTransaction,
  isEditDialogOpen,
  setIsEditDialogOpen,
  queryClient,
  user
}) => {
  const [editForm, setEditForm] = useState({
    amount: '',
    description_bn: '',
    description_en: '',
    notes: '',
    transaction_date: '',
    donor_name: '',
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    type: 'other_income' as TransactionType,
    amount: '',
    description_bn: '',
    description_en: '',
    notes: '',
    transaction_date: `${selectedYear}-01-01`,
    payment_method: 'cash',
    donor_name: '',
  });

  const typeLabels: { [key: string]: { bn: string; en: string } } = {
    member_fee: { bn: 'সদস্য চাঁদা', en: 'Member Fee' },
    donation: { bn: 'দান/অনুদান', en: 'Donation' },
    event_fee: { bn: 'অনুষ্ঠান ফি', en: 'Event Fee' },
    other_income: { bn: 'অন্যান্য আয়', en: 'Other Income' },
    expense: { bn: 'ব্যয়', en: 'Expense' },
    other_expense: { bn: 'অন্যান্য ব্যয়', en: 'Other Expense' },
  };

  const transactionTypes: { value: TransactionType; labelBn: string; labelEn: string }[] = [
    { value: 'member_fee', labelBn: 'সদস্য চাঁদা', labelEn: 'Member Fee' },
    { value: 'donation', labelBn: 'দান/অনুদান', labelEn: 'Donation' },
    { value: 'event_fee', labelBn: 'অনুষ্ঠান ফি', labelEn: 'Event Fee' },
    { value: 'other_income', labelBn: 'অন্যান্য আয়', labelEn: 'Other Income' },
    { value: 'expense', labelBn: 'ব্যয়', labelEn: 'Expense' },
    { value: 'other_expense', labelBn: 'অন্যান্য ব্যয়', labelEn: 'Other Expense' },
  ];

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      amount: transaction.amount.toString(),
      description_bn: transaction.description_bn || '',
      description_en: transaction.description_en || '',
      notes: transaction.notes || '',
      transaction_date: transaction.transaction_date,
      donor_name: transaction.donor_name || '',
    });
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    setAddForm({
      type: 'other_income',
      amount: '',
      description_bn: '',
      description_en: '',
      notes: '',
      transaction_date: `${selectedYear}-01-01`,
      payment_method: 'cash',
      donor_name: '',
    });
    setIsAddDialogOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Transaction> }) => {
      const { error } = await supabase
        .from('transactions')
        .update(data.updates)
        .eq('id', data.id);
      
      if (error) throw error;

      // Log activity
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          user_name: user.email,
          user_role: isAdmin ? 'admin' : 'cashier',
          action_type: 'update',
          entity_type: 'transaction',
          entity_id: data.id,
          description_bn: `লেনদেন আপডেট করা হয়েছে (৳${data.updates.amount})`,
          description_en: `Transaction updated (৳${data.updates.amount})`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yearly-transactions', selectedYear] });
      toast.success(language === 'bn' ? 'লেনদেন আপডেট হয়েছে' : 'Transaction updated');
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (language === 'bn' ? 'আপডেট ব্যর্থ' : 'Update failed'));
    },
  });

  const handleSaveEdit = () => {
    if (!editingTransaction) return;
    
    updateMutation.mutate({
      id: editingTransaction.id,
      updates: {
        amount: parseFloat(editForm.amount),
        description_bn: editForm.description_bn || null,
        description_en: editForm.description_en || null,
        notes: editForm.notes || null,
        transaction_date: editForm.transaction_date,
        donor_name: editForm.donor_name || null,
      },
    });
  };

  // Add new transaction mutation
  const addMutation = useMutation({
    mutationFn: async (data: {
      type: TransactionType;
      amount: number;
      description_bn: string | null;
      description_en: string | null;
      notes: string | null;
      transaction_date: string;
      payment_method: string;
      donor_name: string | null;
    }) => {
      const { error } = await supabase
        .from('transactions')
        .insert({
          type: data.type,
          amount: data.amount,
          description_bn: data.description_bn,
          description_en: data.description_en,
          notes: data.notes,
          transaction_date: data.transaction_date,
          payment_method: data.payment_method,
          donor_name: data.donor_name,
          created_by: user?.id,
        });
      
      if (error) throw error;

      // Log activity
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          user_name: user.email,
          user_role: isAdmin ? 'admin' : 'cashier',
          action_type: 'create',
          entity_type: 'transaction',
          description_bn: `বিগত বছরের লেনদেন যোগ করা হয়েছে (৳${data.amount}) - ${selectedYear}`,
          description_en: `Past year transaction added (৳${data.amount}) - ${selectedYear}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yearly-transactions', selectedYear] });
      toast.success(language === 'bn' ? 'নতুন লেনদেন যোগ হয়েছে' : 'New transaction added');
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || (language === 'bn' ? 'লেনদেন যোগ ব্যর্থ' : 'Failed to add transaction'));
    },
  });

  const handleAddTransaction = () => {
    if (!addForm.amount || parseFloat(addForm.amount) <= 0) {
      toast.error(language === 'bn' ? 'সঠিক পরিমাণ দিন' : 'Enter a valid amount');
      return;
    }

    addMutation.mutate({
      type: addForm.type,
      amount: parseFloat(addForm.amount),
      description_bn: addForm.description_bn || null,
      description_en: addForm.description_en || null,
      notes: addForm.notes || null,
      transaction_date: addForm.transaction_date,
      payment_method: addForm.payment_method,
      donor_name: addForm.donor_name || null,
    });
  };

  return (
    <TabsContent value="transactions">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit className="w-5 h-5" />
              {language === 'bn' ? 'বিগত বছরের লেনদেন সম্পাদনা' : 'Edit Past Year Transactions'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' 
                ? `${selectedYear} সালের সকল লেনদেন এখানে সম্পাদনা বা নতুন যোগ করতে পারবেন`
                : `Edit or add transactions for ${selectedYear}`}
            </CardDescription>
          </div>
          <Button onClick={openAddDialog} className="gap-2">
            <FileText className="w-4 h-4" />
            {language === 'bn' ? 'নতুন লেনদেন যোগ করুন' : 'Add Transaction'}
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {language === 'bn' ? 'এই বছরে কোনো লেনদেন নেই' : 'No transactions found for this year'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ধরন' : 'Type'}</TableHead>
                    <TableHead>{language === 'bn' ? 'বিবরণ' : 'Description'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead className="text-center">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const isIncome = ['member_fee', 'donation', 'event_fee', 'other_income'].includes(transaction.type);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.transaction_date), 'dd MMM yyyy', { 
                            locale: language === 'bn' ? bn : enUS 
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isIncome ? 'default' : 'destructive'} className="text-xs">
                            {typeLabels[transaction.type]?.[language === 'bn' ? 'bn' : 'en'] || transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {language === 'bn' 
                            ? transaction.description_bn || transaction.donor_name || '-'
                            : transaction.description_en || transaction.donor_name || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}৳{Number(transaction.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(transaction)}
                            className="hover:bg-primary/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {language === 'bn' ? 'লেনদেন সম্পাদনা' : 'Edit Transaction'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নাম (সদস্য/দাতা)' : 'Name (Member/Donor)'}</Label>
                <Input
                  value={editForm.donor_name}
                  onChange={(e) => setEditForm({ ...editForm, donor_name: e.target.value })}
                  placeholder={language === 'bn' ? 'নাম লিখুন...' : 'Enter name...'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'তারিখ' : 'Date'}</Label>
                  <Input
                    type="date"
                    value={editForm.transaction_date}
                    onChange={(e) => setEditForm({ ...editForm, transaction_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পরিমাণ (৳)' : 'Amount (৳)'}</Label>
                  <Input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বিবরণ (বাংলা)' : 'Description (Bengali)'}</Label>
                <Textarea
                  value={editForm.description_bn}
                  onChange={(e) => setEditForm({ ...editForm, description_bn: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বিবরণ (ইংরেজি)' : 'Description (English)'}</Label>
                <Textarea
                  value={editForm.description_en}
                  onChange={(e) => setEditForm({ ...editForm, description_en: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নোট' : 'Notes'}</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
            </DialogClose>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending 
                ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') 
                : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {language === 'bn' ? 'নতুন লেনদেন যোগ করুন' : 'Add New Transaction'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'}</Label>
                <Select
                  value={addForm.type}
                  onValueChange={(value) => setAddForm({ ...addForm, type: value as TransactionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {language === 'bn' ? type.labelBn : type.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নাম (সদস্য/দাতা)' : 'Name (Member/Donor)'}</Label>
                <Input
                  value={addForm.donor_name}
                  onChange={(e) => setAddForm({ ...addForm, donor_name: e.target.value })}
                  placeholder={language === 'bn' ? 'নাম লিখুন...' : 'Enter name...'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'তারিখ' : 'Date'}</Label>
                  <Input
                    type="date"
                    value={addForm.transaction_date}
                    onChange={(e) => setAddForm({ ...addForm, transaction_date: e.target.value })}
                    min={`${selectedYear}-01-01`}
                    max={`${selectedYear}-12-31`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পরিমাণ (৳)' : 'Amount (৳)'}</Label>
                  <Input
                    type="number"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'}</Label>
                <Select
                  value={addForm.payment_method}
                  onValueChange={(value) => setAddForm({ ...addForm, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{language === 'bn' ? 'নগদ' : 'Cash'}</SelectItem>
                    <SelectItem value="bank">{language === 'bn' ? 'ব্যাংক' : 'Bank'}</SelectItem>
                    <SelectItem value="mobile">{language === 'bn' ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বিবরণ (বাংলা)' : 'Description (Bengali)'}</Label>
                <Textarea
                  value={addForm.description_bn}
                  onChange={(e) => setAddForm({ ...addForm, description_bn: e.target.value })}
                  rows={2}
                  placeholder={language === 'bn' ? 'বিবরণ লিখুন...' : 'Enter description...'}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বিবরণ (ইংরেজি)' : 'Description (English)'}</Label>
                <Textarea
                  value={addForm.description_en}
                  onChange={(e) => setAddForm({ ...addForm, description_en: e.target.value })}
                  rows={2}
                  placeholder="Enter description..."
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নোট' : 'Notes'}</Label>
                <Textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  rows={2}
                  placeholder={language === 'bn' ? 'অতিরিক্ত নোট...' : 'Additional notes...'}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
            </DialogClose>
            <Button onClick={handleAddTransaction} disabled={addMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {addMutation.isPending 
                ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') 
                : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
};

export default YearlyAccounts;
