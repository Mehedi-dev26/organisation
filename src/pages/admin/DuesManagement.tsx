import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Clock, 
  Loader2,
  Send,
  Filter
} from 'lucide-react';
import { format, subMonths } from 'date-fns';

interface Member {
  id: string;
  member_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
}

interface MemberDue {
  id: string;
  member_id: string;
  month_year: string;
  amount: number;
  is_paid: boolean;
  paid_date: string | null;
  members?: Member;
}

const DuesManagement = () => {
  const { language } = useLanguage();
  const { isAdmin, isCashier } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('unpaid');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Generate last 12 months options
  const monthOptions = React.useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      months.push({ value, label });
    }
    return months;
  }, []);

  // Fetch all members
  const { data: members = [] } = useQuery({
    queryKey: ['members-for-dues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'approved')
        .order('full_name');
      
      if (error) throw error;
      return data as Member[];
    }
  });

  // Fetch member dues
  const { data: dues = [], isLoading } = useQuery({
    queryKey: ['member-dues', filterStatus, selectedMonth],
    queryFn: async () => {
      let query = supabase
        .from('member_dues')
        .select(`
          *,
          members (
            id,
            member_id,
            full_name,
            email,
            phone,
            status
          )
        `)
        .order('month_year', { ascending: false });
      
      if (filterStatus === 'paid') {
        query = query.eq('is_paid', true);
      } else if (filterStatus === 'unpaid') {
        query = query.eq('is_paid', false);
      }

      if (selectedMonth !== 'all') {
        query = query.eq('month_year', selectedMonth);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as MemberDue[];
    }
  });

  // Generate dues for a specific month
  const generateDuesMutation = useMutation({
    mutationFn: async (monthYear: string) => {
      const duesAmount = 100; // Default monthly due amount
      
      const existingDues = dues.filter(d => d.month_year === monthYear);
      const existingMemberIds = existingDues.map(d => d.member_id);
      
      const newDues = members
        .filter(m => !existingMemberIds.includes(m.id))
        .map(member => ({
          member_id: member.id,
          month_year: monthYear,
          amount: duesAmount,
          is_paid: false
        }));
      
      if (newDues.length === 0) {
        throw new Error('সব সদস্যের জন্য এই মাসের চাঁদা ইতিমধ্যে তৈরি করা হয়েছে');
      }
      
      const { error } = await supabase
        .from('member_dues')
        .insert(newDues);
      
      if (error) throw error;
      return newDues.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? `${count} জন সদস্যের জন্য চাঁদা তৈরি হয়েছে` 
          : `Dues generated for ${count} members`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Send reminder emails
  const sendRemindersMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const unpaidDues = dues.filter(d => 
        memberIds.includes(d.member_id) && 
        !d.is_paid && 
        d.members?.email
      );

      if (unpaidDues.length === 0) {
        throw new Error('কোনো সদস্যের ইমেইল নেই বা সবার চাঁদা পরিশোধিত');
      }

      const reminderData = unpaidDues.map(due => ({
        member_name: due.members?.full_name,
        member_email: due.members?.email,
        month_year: due.month_year,
        amount: due.amount
      }));

      const { data, error } = await supabase.functions.invoke('send-dues-reminder', {
        body: { reminders: reminderData }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setIsReminderDialogOpen(false);
      setSelectedMembers([]);
      toast({
        title: language === 'bn' ? 'রিমাইন্ডার পাঠানো হয়েছে!' : 'Reminders sent!',
        description: language === 'bn' 
          ? `${data.sent} জনকে ইমেইল পাঠানো হয়েছে` 
          : `Email sent to ${data.sent} members`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Filter dues based on search
  const filteredDues = dues.filter(due => {
    const memberName = due.members?.full_name?.toLowerCase() || '';
    const memberId = due.members?.member_id?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return memberName.includes(query) || memberId.includes(query);
  });

  // Group dues by member for summary
  const memberDuesSummary = React.useMemo(() => {
    const summary: Record<string, { member: Member; unpaidCount: number; totalUnpaid: number }> = {};
    
    dues.filter(d => !d.is_paid).forEach(due => {
      if (due.members) {
        if (!summary[due.member_id]) {
          summary[due.member_id] = {
            member: due.members,
            unpaidCount: 0,
            totalUnpaid: 0
          };
        }
        summary[due.member_id].unpaidCount++;
        summary[due.member_id].totalUnpaid += Number(due.amount);
      }
    });
    
    return Object.values(summary);
  }, [dues]);

  const totalUnpaid = memberDuesSummary.reduce((sum, s) => sum + s.totalUnpaid, 0);
  const totalUnpaidMembers = memberDuesSummary.length;

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unpaidMemberIds = memberDuesSummary
        .filter(s => s.member.email)
        .map(s => s.member.id);
      setSelectedMembers(unpaidMemberIds);
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSendReminders = async () => {
    if (selectedMembers.length === 0) {
      toast({
        title: language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Select members',
        description: language === 'bn' 
          ? 'রিমাইন্ডার পাঠাতে অন্তত একজন সদস্য নির্বাচন করুন' 
          : 'Select at least one member to send reminder',
        variant: 'destructive',
      });
      return;
    }
    setIsSendingReminders(true);
    await sendRemindersMutation.mutateAsync(selectedMembers);
    setIsSendingReminders(false);
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'bn' ? 'বকেয়া চাঁদা ব্যবস্থাপনা' : 'Dues Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'bn' ? 'সদস্যদের মাসিক চাঁদা ট্র্যাক করুন এবং রিমাইন্ডার পাঠান' : 'Track member dues and send reminders'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => generateDuesMutation.mutate(format(new Date(), 'yyyy-MM'))}
            disabled={generateDuesMutation.isPending}
          >
            {generateDuesMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {language === 'bn' ? 'এই মাসের চাঁদা তৈরি করুন' : 'Generate This Month Dues'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট বকেয়া' : 'Total Unpaid'}
                </p>
                <p className="text-2xl font-bold text-red-600">৳{totalUnpaid.toLocaleString('bn-BD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'বকেয়াধারী সদস্য' : 'Members with Dues'}
                </p>
                <p className="text-2xl font-bold text-amber-600">{totalUnpaidMembers}</p>
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
                  {language === 'bn' ? 'পরিশোধিত (এই মাস)' : 'Paid (This Month)'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {dues.filter(d => d.is_paid && d.month_year === format(new Date(), 'yyyy-MM')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট সদস্য' : 'Total Members'}
                </p>
                <p className="text-2xl font-bold text-blue-600">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {language === 'bn' ? 'বকেয়া তালিকা' : 'Dues List'}
            </CardTitle>
            <Button 
              onClick={() => setIsReminderDialogOpen(true)}
              variant="destructive"
              disabled={selectedMembers.length === 0}
            >
              <Mail className="w-4 h-4 mr-2" />
              {language === 'bn' ? `রিমাইন্ডার পাঠান (${selectedMembers.length})` : `Send Reminder (${selectedMembers.length})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={language === 'bn' ? 'সদস্যের নাম বা আইডি খুঁজুন...' : 'Search member name or ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'bn' ? 'স্ট্যাটাস' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সব' : 'All'}</SelectItem>
                <SelectItem value="unpaid">{language === 'bn' ? 'বকেয়া' : 'Unpaid'}</SelectItem>
                <SelectItem value="paid">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'bn' ? 'মাস' : 'Month'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সব মাস' : 'All Months'}</SelectItem>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedMembers.length === memberDuesSummary.filter(s => s.member.email).length && selectedMembers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{language === 'bn' ? 'সদস্য আইডি' : 'Member ID'}</TableHead>
                    <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                    <TableHead>{language === 'bn' ? 'মাস' : 'Month'}</TableHead>
                    <TableHead>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ইমেইল' : 'Email'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {language === 'bn' ? 'কোনো চাঁদা পাওয়া যায়নি' : 'No dues found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDues.map((due) => (
                      <TableRow key={due.id}>
                        <TableCell>
                          {!due.is_paid && due.members?.email && (
                            <Checkbox 
                              checked={selectedMembers.includes(due.member_id)}
                              onCheckedChange={(checked) => handleSelectMember(due.member_id, checked as boolean)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-mono">{due.members?.member_id}</TableCell>
                        <TableCell className="font-medium">{due.members?.full_name}</TableCell>
                        <TableCell>{due.month_year}</TableCell>
                        <TableCell>৳{Number(due.amount).toLocaleString('bn-BD')}</TableCell>
                        <TableCell>
                          {due.is_paid ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {language === 'bn' ? 'বকেয়া' : 'Unpaid'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {due.members?.email || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminder Confirmation Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'bn' ? 'রিমাইন্ডার পাঠান' : 'Send Reminder'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {language === 'bn' 
                ? `আপনি ${selectedMembers.length} জন সদস্যকে বকেয়া চাঁদার রিমাইন্ডার ইমেইল পাঠাতে চাচ্ছেন।`
                : `You are about to send reminder emails to ${selectedMembers.length} members.`
              }
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">
                {language === 'bn' ? 'নির্বাচিত সদস্যগণ:' : 'Selected members:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.slice(0, 5).map(id => {
                  const member = members.find(m => m.id === id);
                  return member ? (
                    <Badge key={id} variant="secondary">{member.full_name}</Badge>
                  ) : null;
                })}
                {selectedMembers.length > 5 && (
                  <Badge variant="secondary">+{selectedMembers.length - 5} আরো</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleSendReminders}
                disabled={isSendingReminders}
              >
                {isSendingReminders ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {language === 'bn' ? 'পাঠান' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DuesManagement;
