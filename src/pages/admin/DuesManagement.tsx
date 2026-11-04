import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Filter,
  BellRing,
  Plus,
  Smartphone,
  Sparkles,
  CheckCheck,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { DuesReminderSetupDialog } from '@/components/admin/DuesReminderSetupDialog';
import { format, subMonths } from 'date-fns';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { 
  getSmsGatewaySettings, 
  sendBulkSms, 
  renderSmsTemplate, 
  calculateSmsParts, 
  DEFAULT_SMS_SETTINGS, 
  type SmsGatewaySettings 
} from '@/services/smsService';
import { createBatchMagicPaymentLinks } from '@/lib/magicLinkUtils';

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
  
  // Real-time subscription for member dues
  useRealtimeSubscription({ table: 'member_dues', queryKey: ['member-dues'] });
  
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  const [filterStatus, setFilterStatus] = useState<string>('unpaid');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  // Reminder Dialog State
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isAutoReminderSetupOpen, setIsAutoReminderSetupOpen] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [sendViaSms, setSendViaSms] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [customSmsMessage, setCustomSmsMessage] = useState('');
  const [sendingProgress, setSendingProgress] = useState<{ current: number; total: number } | null>(null);

  // Generate Dues Dialog State
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  // Fetch SMS Settings to get template
  const { data: smsSettings = DEFAULT_SMS_SETTINGS } = useQuery({
    queryKey: ['sms-gateway-settings'],
    queryFn: getSmsGatewaySettings,
  });

  // Keep custom message synchronized with SMS settings template initially
  useEffect(() => {
    if (smsSettings?.duesSmsTemplate && !customSmsMessage) {
      setCustomSmsMessage(smsSettings.duesSmsTemplate);
    }
  }, [smsSettings, customSmsMessage]);

  // Generate last 12 months options
  const monthOptions = useMemo(() => {
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
      
      const { data: existingDuesData, error: fetchError } = await supabase
        .from('member_dues')
        .select('member_id')
        .eq('month_year', monthYear);
      
      if (fetchError) throw fetchError;
      
      const existingMemberIds = existingDuesData?.map(d => d.member_id) || [];
      
      const newDues = members
        .filter(m => !existingMemberIds.includes(m.id))
        .map(member => ({
          member_id: member.id,
          month_year: monthYear,
          amount: duesAmount,
          is_paid: false
        }));
      
      if (newDues.length === 0) {
        throw new Error(language === 'bn' 
          ? 'সব সদস্যের জন্য এই মাসের চাঁদা ইতিমধ্যে তৈরি করা হয়েছে' 
          : 'Dues already exist for all members for this month');
      }
      
      const { error } = await supabase
        .from('member_dues')
        .insert(newDues);
      
      if (error) throw error;
      return { count: newDues.length, monthYear };
    },
    onSuccess: ({ count, monthYear }) => {
      queryClient.invalidateQueries({ queryKey: ['member-dues'] });
      setIsGenerateDialogOpen(false);
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? `${monthYear} মাসে ${count} জন সদস্যের জন্য চাঁদা তৈরি হয়েছে` 
          : `Dues generated for ${count} members for ${monthYear}`,
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

  // Filter dues based on search (Name, Member ID, Phone, Email)
  const filteredDues = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return dues;
    return dues.filter(due => {
      const memberName = due.members?.full_name?.toLowerCase() || '';
      const memberId = due.members?.member_id?.toLowerCase() || '';
      const phone = due.members?.phone?.toLowerCase() || '';
      const email = due.members?.email?.toLowerCase() || '';
      return memberName.includes(query) || memberId.includes(query) || phone.includes(query) || email.includes(query);
    });
  }, [dues, searchQuery]);

  // Group all unpaid dues by member for summary cards
  const memberDuesSummary = useMemo(() => {
    const summary: Record<string, { member: Member; unpaidCount: number; totalUnpaid: number; dueRecordId?: string }> = {};
    
    dues.filter(d => !d.is_paid).forEach(due => {
      if (due.members) {
        if (!summary[due.member_id]) {
          summary[due.member_id] = {
            member: due.members,
            unpaidCount: 0,
            totalUnpaid: 0,
            dueRecordId: due.id
          };
        }
        summary[due.member_id].unpaidCount++;
        summary[due.member_id].totalUnpaid += Number(due.amount || 0);
      }
    });
    
    return Object.values(summary);
  }, [dues]);

  const totalUnpaid = memberDuesSummary.reduce((sum, s) => sum + s.totalUnpaid, 0);
  const totalUnpaidMembers = memberDuesSummary.length;

  // Unpaid unique members from currently filtered list
  const filteredUnpaidMembers = useMemo(() => {
    const map = new Map<string, { member: Member; unpaidDues: MemberDue[]; totalAmount: number; months: string[] }>();
    
    filteredDues.filter(d => !d.is_paid).forEach(due => {
      if (!due.members) return;
      const existing = map.get(due.member_id);
      if (existing) {
        existing.unpaidDues.push(due);
        existing.totalAmount += Number(due.amount || 0);
        if (!existing.months.includes(due.month_year)) {
          existing.months.push(due.month_year);
        }
      } else {
        map.set(due.member_id, {
          member: due.members,
          unpaidDues: [due],
          totalAmount: Number(due.amount || 0),
          months: [due.month_year]
        });
      }
    });

    return Array.from(map.values());
  }, [filteredDues]);

  // Selected Members Data breakdown
  const selectedMembersData = useMemo(() => {
    const summaryMap = new Map<string, { member: Member; unpaidCount: number; totalAmount: number; months: string[]; latestDueId?: string }>();
    
    // Group from dues to get true unpaid amounts
    dues.filter(d => !d.is_paid && selectedMemberIds.includes(d.member_id)).forEach(due => {
      if (!due.members) return;
      const existing = summaryMap.get(due.member_id);
      if (existing) {
        existing.unpaidCount++;
        existing.totalAmount += Number(due.amount || 0);
        if (!existing.months.includes(due.month_year)) {
          existing.months.push(due.month_year);
        }
      } else {
        summaryMap.set(due.member_id, {
          member: due.members,
          unpaidCount: 1,
          totalAmount: Number(due.amount || 0),
          months: [due.month_year],
          latestDueId: due.id
        });
      }
    });

    return Array.from(summaryMap.values());
  }, [dues, selectedMemberIds]);

  const selectedTotalAmount = selectedMembersData.reduce((sum, s) => sum + s.totalAmount, 0);
  const selectedPhoneCount = selectedMembersData.filter(s => s.member.phone && s.member.phone.trim().length >= 10).length;
  const selectedEmailCount = selectedMembersData.filter(s => s.member.email && s.member.email.includes('@')).length;

  // Toggle selection for individual member
  const handleToggleMember = (memberId: string, checked: boolean) => {
    if (checked) {
      if (!selectedMemberIds.includes(memberId)) {
        setSelectedMemberIds([...selectedMemberIds, memberId]);
      }
    } else {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId));
    }
  };

  // Header "Select All" toggle for filtered unpaid
  const handleSelectAllFiltered = (checked: boolean) => {
    if (checked) {
      const allFilteredMemberIds = filteredUnpaidMembers.map(item => item.member.id);
      setSelectedMemberIds(allFilteredMemberIds);
    } else {
      setSelectedMemberIds([]);
    }
  };

  // Quick Action: Select first 10 members
  const handleSelectFirstTen = () => {
    const firstTenIds = filteredUnpaidMembers.slice(0, 10).map(item => item.member.id);
    setSelectedMemberIds(firstTenIds);
    toast({
      title: language === 'bn' ? '১০ জন নির্বাচিত' : '10 Members Selected',
      description: language === 'bn' ? 'তালিকার প্রথম ১০ জন সদস্যকে নির্বাচন করা হয়েছে।' : 'First 10 members in list selected.',
    });
  };

  // Quick Action: Select all filtered
  const handleSelectAllAction = () => {
    const allIds = filteredUnpaidMembers.map(item => item.member.id);
    setSelectedMemberIds(allIds);
    toast({
      title: language === 'bn' ? 'সবাই নির্বাচিত' : 'All Selected',
      description: language === 'bn' ? `ফিল্টার অনুযায়ী মোট ${allIds.length} জন সদস্য নির্বাচিত হয়েছেন।` : `Selected ${allIds.length} filtered members.`,
    });
  };

  // Quick Action: Clear selection
  const handleClearSelection = () => {
    setSelectedMemberIds([]);
  };

  // Open single member reminder
  const handleOpenSingleReminder = (memberId: string) => {
    setSelectedMemberIds([memberId]);
    setIsReminderDialogOpen(true);
  };

  // Live SMS preview and character counter calculation
  const sampleMemberData = selectedMembersData[0] || filteredUnpaidMembers[0] || {
    member: { full_name: 'মোঃ কামরুল হাসান', member_id: 'SB-2601', phone: '01700000000' },
    totalAmount: 100,
    months: ['2026-11']
  };

  const previewTemplateText = renderSmsTemplate(
    customSmsMessage || smsSettings.duesSmsTemplate, 
    {
      name: sampleMemberData.member.full_name,
      member_id: sampleMemberData.member.member_id || '2601',
      month: sampleMemberData.months ? sampleMemberData.months.join(', ') : 'চলতি মাস',
      amount: sampleMemberData.totalAmount || 100,
      org_name: 'সময়ের বাতিঘর',
      payment_link: 'https://samoyerbatighor.pro.bd/pay?t=PL-2601-8K3M'
    }
  );

  const previewSmsStats = calculateSmsParts(previewTemplateText);

  // Send Manual Reminders (SMS + Email) with Personalized Smart Magic Links
  const handleSendManualReminders = async () => {
    if (selectedMemberIds.length === 0) {
      toast({
        title: language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Select members',
        description: language === 'bn' 
          ? 'রিমাইন্ডার পাঠাতে অন্তত একজন সদস্য নির্বাচন করুন' 
          : 'Select at least one member to send reminder',
        variant: 'destructive',
      });
      return;
    }

    if (!sendViaSms && !sendViaEmail) {
      toast({
        title: language === 'bn' ? 'মাধ্যম নির্বাচন করুন' : 'Select Channel',
        description: language === 'bn' 
          ? 'অনুগ্রহ করে SMS অথবা ইমেইলের যেকোনো একটি বা উভয় মাধ্যম চালু করুন।' 
          : 'Please enable SMS or Email channel.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingReminders(true);
    setSendingProgress({ current: 0, total: selectedMembersData.length });

    let smsSuccessCount = 0;
    let emailSuccessCount = 0;
    const errors: string[] = [];

    try {
      // 1. Generate unique one-time personalized Smart Magic Links for all selected members
      const magicLinksMap = await createBatchMagicPaymentLinks(
        selectedMembersData.map(item => ({
          memberId: item.member.id,
          memberDisplayId: item.member.member_id || '2601',
          memberName: item.member.full_name,
          memberPhone: item.member.phone || '',
          amount: item.totalAmount,
          month: item.months.join(', '),
          dueId: item.latestDueId || null,
        }))
      );

      // 2. Dispatch SMS Gateway messages if SMS is enabled
      if (sendViaSms) {
        const eligibleSmsMembers = selectedMembersData.filter(
          item => item.member.phone && item.member.phone.trim().length >= 10
        );

        if (eligibleSmsMembers.length > 0) {
          const smsRecipients = eligibleSmsMembers.map(item => {
            const magicUrl = magicLinksMap[item.member.id]?.url || `https://samoyerbatighor.pro.bd/pay?m=${item.member.member_id}`;
            const customizedText = renderSmsTemplate(customSmsMessage || smsSettings.duesSmsTemplate, {
              name: item.member.full_name,
              member_id: item.member.member_id || 'N/A',
              month: item.months.join(', '),
              amount: item.totalAmount,
              org_name: 'সময়ের বাতিঘর',
              payment_link: magicUrl,
            });

            return {
              phone: item.member.phone!,
              name: item.member.full_name,
              memberId: item.member.member_id,
              customMessage: customizedText,
            };
          });

          const smsResult = await sendBulkSms(
            smsRecipients,
            previewTemplateText,
            'dues_reminder',
            (completed, total) => {
              setSendingProgress({ current: completed, total });
            }
          );

          smsSuccessCount = smsResult.successful;
          if (smsResult.failed > 0) {
            errors.push(`${smsResult.failed} জনের SMS পাঠাতে সমস্যা হয়েছে`);
          }
        }
      }

      // 3. Dispatch Email reminders if Email is enabled
      if (sendViaEmail) {
        const eligibleEmailMembers = selectedMembersData.filter(
          item => item.member.email && item.member.email.includes('@')
        );

        if (eligibleEmailMembers.length > 0) {
          const reminderData = eligibleEmailMembers.map(item => ({
            member_name: item.member.full_name,
            member_email: item.member.email!,
            month_year: item.months.join(', '),
            amount: item.totalAmount,
            payment_link: magicLinksMap[item.member.id]?.url || 'https://samoyerbatighor.pro.bd/pay',
          }));

          try {
            const { data: emailData, error: emailError } = await supabase.functions.invoke('send-dues-reminder', {
              body: { reminders: reminderData }
            });

            if (emailError) {
              console.warn('Email dispatch notice:', emailError);
              errors.push('ইমেইল সার্ভিসের সংযোগে সমস্যা হয়েছে');
            } else if (emailData) {
              emailSuccessCount = emailData.sent || 0;
            }
          } catch (fnErr: any) {
            console.warn('Edge function invoke error:', fnErr);
            errors.push('ইমেইল পাঠানোর চেষ্টা সম্পন্ন হয়নি');
          }
        }
      }

      // 4. Toast notifications & cleanup
      toast({
        title: language === 'bn' ? 'রিমাইন্ডার পাঠানো সম্পন্ন!' : 'Reminders Sent!',
        description: language === 'bn' 
          ? `${smsSuccessCount > 0 ? `📱 ${smsSuccessCount} জনকে SMS (ম্যাজিক লিংক সহ) ` : ''}${emailSuccessCount > 0 ? `✉️ ${emailSuccessCount} জনকে ইমেইল ` : ''}সফলভাবে পাঠানো হয়েছে।`
          : `Sent to ${smsSuccessCount} via SMS and ${emailSuccessCount} via Email.`,
      });

      if (errors.length > 0 && smsSuccessCount === 0 && emailSuccessCount === 0) {
        toast({
          title: language === 'bn' ? 'সতর্কতা' : 'Warning',
          description: errors.join('; '),
          variant: 'destructive',
        });
      }

      setIsReminderDialogOpen(false);
      setSelectedMemberIds([]);
    } catch (err: any) {
      console.error('Error in handleSendManualReminders:', err);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err.message || 'রিমাইন্ডার পাঠাতে ব্যর্থ হয়েছে।',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReminders(false);
      setSendingProgress(null);
    }
  };

  const isAllFilteredSelected = 
    filteredUnpaidMembers.length > 0 && 
    filteredUnpaidMembers.every(item => selectedMemberIds.includes(item.member.id));

  if (!isAdmin && !isCashier) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-muted-foreground font-medium">
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
          <p className="text-muted-foreground text-sm">
            {language === 'bn' 
              ? 'সদস্যদের বকেয়া তালিকা ফিল্টারিং, সিলেকশন ও ব্যক্তিগত ম্যাজিক পেমেন্ট লিংক সহ রিমাইন্ডার পাঠান' 
              : 'Track member dues, filter, select and send reminders with smart magic payment links'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAutoReminderSetupOpen(true)}
            className="rounded-xl border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-xs gap-1.5 h-10 shadow-xs cursor-pointer"
          >
            <BellRing className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'স্বয়ংক্রিয় রিমাইন্ডার সেটআপ' : 'Auto Reminder Setup'}</span>
          </Button>

          <Button 
            onClick={() => setIsGenerateDialogOpen(true)}
            className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl shadow-md gap-1.5 h-10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'চাঁদা তৈরি করুন' : 'Generate Dues'}</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {language === 'bn' ? 'মোট বকেয়া' : 'Total Unpaid'}
                </p>
                <p className="text-2xl font-bold text-red-600">৳{totalUnpaid.toLocaleString('bn-BD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {language === 'bn' ? 'বকেয়াধারী সদস্য' : 'Members with Dues'}
                </p>
                <p className="text-2xl font-bold text-amber-600">{totalUnpaidMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {language === 'bn' ? 'পরিশোধিত (এই মাস)' : 'Paid (This Month)'}
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {dues.filter(d => d.is_paid && d.month_year === format(new Date(), 'yyyy-MM')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {language === 'bn' ? 'মোট সক্রিয় সদস্য' : 'Active Members'}
                </p>
                <p className="text-2xl font-bold text-blue-600">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5 text-[#0B6B3A]" />
              <span>{language === 'bn' ? 'বকেয়া তালিকা ও রিমাইন্ডার' : 'Dues List & Reminders'}</span>
            </CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                onClick={() => setIsReminderDialogOpen(true)}
                disabled={selectedMemberIds.length === 0}
                className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl shadow-sm gap-2 h-9 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn' 
                    ? `ম্যানুয়াল রিমাইন্ডার পাঠান (${selectedMemberIds.length})` 
                    : `Send Reminders (${selectedMemberIds.length})`}
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Search, Status & Month Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={language === 'bn' ? 'সদস্যের নাম, আইডি, ফোন বা ইমেইল দিয়ে খুঁজুন...' : 'Search by name, ID, phone or email...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl">
                <SelectValue placeholder={language === 'bn' ? 'স্ট্যাটাস' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">{language === 'bn' ? 'বকেয়া তালিকা' : 'Unpaid Only'}</SelectItem>
                <SelectItem value="paid">{language === 'bn' ? 'পরিশোধিত তালিকা' : 'Paid Only'}</SelectItem>
                <SelectItem value="all">{language === 'bn' ? 'সকল তালিকা' : 'All Dues'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[170px] h-10 rounded-xl">
                <SelectValue placeholder={language === 'bn' ? 'মাস' : 'Month'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সকল মাস' : 'All Months'}</SelectItem>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selection Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/50 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-muted-foreground">
                {language === 'bn' ? 'দ্রুত নির্বাচন:' : 'Quick Selection:'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectFirstTen}
                disabled={filteredUnpaidMembers.length === 0}
                className="h-7 text-xs rounded-lg px-2.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {language === 'bn' ? 'প্রথম ১০ জন' : 'First 10 Members'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllAction}
                disabled={filteredUnpaidMembers.length === 0}
                className="h-7 text-xs rounded-lg px-2.5 border-blue-600/30 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                {language === 'bn' ? `ফিল্টার অনুযায়ী সবাই (${filteredUnpaidMembers.length})` : `All Filtered (${filteredUnpaidMembers.length})`}
              </Button>

              {selectedMemberIds.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-7 text-xs rounded-lg px-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  {language === 'bn' ? 'নির্বাচন মুছুন' : 'Clear Selection'}
                </Button>
              )}
            </div>

            <div className="text-muted-foreground text-xs font-medium">
              {language === 'bn' 
                ? `প্রদর্শিত: ${filteredDues.length} টি চাঁদা রেকর্ড` 
                : `Showing: ${filteredDues.length} dues records`}
            </div>
          </div>

          {/* Floating / Sticky Bulk Action Bar if items selected */}
          {selectedMemberIds.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-[#0B6B3A]/40 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-[#0B6B3A] text-white hover:bg-[#0B6B3A] text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {language === 'bn' ? `নির্বাচিত: ${selectedMemberIds.length} জন` : `Selected: ${selectedMemberIds.length}`}
                  </Badge>
                  <span className="text-sm font-bold text-foreground">
                    {language === 'bn' ? 'মোট বকেয়া:' : 'Total Due:'} <span className="text-red-600">৳{selectedTotalAmount.toLocaleString('bn-BD')}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'bn' ? `ফোন নম্বর আছে: ${selectedPhoneCount} জন` : `Phone available: ${selectedPhoneCount}`}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'bn' ? `ইমেইল আছে: ${selectedEmailCount} জন` : `Email available: ${selectedEmailCount}`}</span>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'ওয়ান-টাইম ম্যাজিক লিংক সহ প্রস্তুত' : 'Ready with One-time Magic Link'}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  className="rounded-xl h-9 text-xs cursor-pointer border-border/80"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsReminderDialogOpen(true)}
                  className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl shadow-md gap-2 h-9 px-4 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'নির্বাচিতদের রিমাইন্ডার পাঠান' : 'Send Reminders to Selected'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B6B3A]" />
              <p className="text-xs text-muted-foreground">{language === 'bn' ? 'চাঁদার তথ্য লোড হচ্ছে...' : 'Loading dues...'}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <Checkbox 
                        checked={isAllFilteredSelected}
                        onCheckedChange={handleSelectAllFiltered}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>{language === 'bn' ? 'সদস্য আইডি' : 'Member ID'}</TableHead>
                    <TableHead>{language === 'bn' ? 'সদস্যের নাম' : 'Member Name'}</TableHead>
                    <TableHead>{language === 'bn' ? 'যোগাযোগ' : 'Contact'}</TableHead>
                    <TableHead>{language === 'bn' ? 'মাস' : 'Month'}</TableHead>
                    <TableHead>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-medium">
                          {language === 'bn' ? 'কোনো চাঁদা রেকর্ড পাওয়া যায়নি' : 'No dues records found'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDues.map((due) => {
                      const isUnpaid = !due.is_paid;
                      const isSelected = selectedMemberIds.includes(due.member_id);

                      return (
                        <TableRow 
                          key={due.id}
                          className={`transition-colors ${isSelected ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''}`}
                        >
                          <TableCell className="text-center">
                            {isUnpaid ? (
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={(checked) => handleToggleMember(due.member_id, checked as boolean)}
                                aria-label={`Select ${due.members?.full_name}`}
                              />
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                            {due.members?.member_id || '-'}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            <div>
                              <span>{due.members?.full_name || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                              {due.members?.phone ? (
                                <span className="flex items-center gap-1 font-mono text-[11px] text-foreground">
                                  <Smartphone className="w-3 h-3 text-emerald-600" />
                                  <span>{due.members.phone}</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50 text-[10px] italic">কোনো ফোন নেই</span>
                              )}
                              {due.members?.email && (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[170px]" title={due.members.email}>
                                  <Mail className="w-3 h-3 text-blue-500" />
                                  <span>{due.members.email}</span>
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {due.month_year}
                          </TableCell>
                          <TableCell className="font-bold text-sm">
                            ৳{Number(due.amount || 0).toLocaleString('bn-BD')}
                          </TableCell>
                          <TableCell>
                            {due.is_paid ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-0.5">
                                <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                                {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs py-0.5">
                                <AlertCircle className="w-3 h-3 mr-1 text-red-500" />
                                {language === 'bn' ? 'বকেয়া' : 'Unpaid'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isUnpaid ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenSingleReminder(due.member_id)}
                                className="rounded-lg h-8 px-2.5 text-xs font-semibold border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Send className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{language === 'bn' ? 'রিমাইন্ডার' : 'Reminder'}</span>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 italic">সম্পন্ন</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Dues Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {language === 'bn' ? 'মাসিক চাঁদা তৈরি করুন' : 'Generate Monthly Dues'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'bn' 
                ? 'যে মাসের জন্য চাঁদা তৈরি করতে চান সেটি নির্বাচন করুন। যদি কোনো সদস্যের জন্য উক্ত মাসের চাঁদা ইতিমধ্যে তৈরি থাকে, তবে ডুপ্লিকেট হবে না।'
                : 'Select the month for which you want to generate dues. Duplicate records will not be created.'}
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {language === 'bn' ? 'মাস নির্বাচন করুন' : 'Select Month'}
              </Label>
              <Select value={generateMonth} onValueChange={setGenerateMonth}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder={language === 'bn' ? 'মাস নির্বাচন করুন' : 'Select Month'} />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)} className="rounded-xl h-9 text-xs">
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button 
                onClick={() => generateDuesMutation.mutate(generateMonth)}
                disabled={generateDuesMutation.isPending}
                className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl h-9 shadow-md"
              >
                {generateDuesMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {language === 'bn' ? 'চাঁদা তৈরি করুন' : 'Generate Dues'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Manual Reminder Dialog (SMS & Email with Smart Magic Link) */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="sm:max-w-[620px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-[#0B6B3A]">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {language === 'bn' ? 'ম্যানুয়াল বকেয়া চাঁদা রিমাইন্ডার পাঠান' : 'Send Manual Dues Reminders'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {language === 'bn' 
                    ? 'নির্বাচিত সদস্যদের ব্যক্তিগত ওয়ান-টাইম সিকিউর পেমেন্ট লিংক সহ নোটিফিকেশন পাঠান' 
                    : 'Dispatch reminders with personalized secure one-time payment magic links'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Recipients Summary Card */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/10 border border-[#0B6B3A]/20 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {language === 'bn' ? 'নির্বাচিত প্রাপক সংখ্যা:' : 'Selected Recipients:'}
                </span>
                <Badge className="bg-[#0B6B3A] text-white hover:bg-[#0B6B3A] font-bold">
                  {selectedMemberIds.length} জন সদস্য
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                <span>মোট বকেয়া পরিমাণ: <strong className="text-red-600">৳{selectedTotalAmount.toLocaleString('bn-BD')}</strong></span>
                <span>📱 ফোন নম্বর: <strong>{selectedPhoneCount} জন</strong> | ✉️ ইমেইল: <strong>{selectedEmailCount} জন</strong></span>
              </div>
            </div>

            {/* Channels Selection */}
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>{language === 'bn' ? 'রিমাইন্ডার পাঠানোর মাধ্যম নির্বাচন করুন:' : 'Select Reminder Channels:'}</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* SMS Channel Card */}
                <div 
                  onClick={() => setSendViaSms(!sendViaSms)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    sendViaSms 
                      ? 'border-[#0B6B3A] bg-emerald-500/5' 
                      : 'border-border/60 bg-muted/20 opacity-70'
                  }`}
                >
                  <Checkbox 
                    checked={sendViaSms} 
                    onCheckedChange={(c) => setSendViaSms(!!c)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'bn' ? 'মোবাইল এসএমএস (SMS Gateway)' : 'SMS Gateway'}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {language === 'bn' 
                        ? `${selectedPhoneCount} জনের ফোনে ম্যাজিক লিংক সহ তাৎক্ষণিক SMS যাবে` 
                        : `Instant SMS with magic link to ${selectedPhoneCount} members`}
                    </p>
                  </div>
                </div>

                {/* Email Channel Card */}
                <div 
                  onClick={() => setSendViaEmail(!sendViaEmail)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    sendViaEmail 
                      ? 'border-[#0B6B3A] bg-emerald-500/5' 
                      : 'border-border/60 bg-muted/20 opacity-70'
                  }`}
                >
                  <Checkbox 
                    checked={sendViaEmail} 
                    onCheckedChange={(c) => setSendViaEmail(!!c)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'bn' ? 'ইমেইল নোটিফিকেশন' : 'Email Notification'}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {language === 'bn' 
                        ? `${selectedEmailCount} জনের ইমেইলে সরাসরি পেমেন্ট বাটন যাবে` 
                        : `Payment button email to ${selectedEmailCount} members`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Magic Link Callout */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  {language === 'bn' ? 'স্মার্ট ওয়ান-টাইম ম্যাজিক পেমেন্ট লিংক সুরক্ষা:' : 'Smart One-Time Magic Link Protection:'}
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {language === 'bn' 
                    ? 'প্রতিটি সদস্যের জন্য একটি স্বতন্ত্র একবার ব্যবহারযোগ্য সিকিউর লিংক (https://samoyerbatighor.pro.bd/pay?t=...) জেনারেট হবে। সদস্য লিংকে ক্লিক করলে কোনো লগইন ছাড়াই সরাসরি তার নির্দিষ্ট বকেয়া দেখতে ও বিকাশ/নগদে পরিশোধ করতে পারবে।'
                    : 'Each member receives a unique one-time link (samoyerbatighor.pro.bd/pay?t=...) allowing instant payment without manual login.'}
                </p>
              </div>
            </div>

            {/* SMS Message Customization & Live Preview (if SMS enabled) */}
            {sendViaSms && (
              <div className="space-y-2 border border-border/50 rounded-xl p-3 bg-muted/20">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-bold flex items-center gap-1 text-foreground">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'bn' ? 'এসএমএস ফরম্যাট / বার্তা:' : 'SMS Message Content:'}</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {previewSmsStats.chars} অক্ষর ({previewSmsStats.parts} SMS)
                  </span>
                </div>
                <Textarea 
                  value={customSmsMessage}
                  onChange={(e) => setCustomSmsMessage(e.target.value)}
                  rows={3}
                  className="text-xs font-mono rounded-xl resize-none"
                  placeholder="SMS ফরম্যাট লিখুন..."
                />
                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
                  <span>চলকসমূহ:</span>
                  <code className="bg-background px-1 py-0.2 rounded border">{"{name}"}</code>
                  <code className="bg-background px-1 py-0.2 rounded border">{"{member_id}"}</code>
                  <code className="bg-background px-1 py-0.2 rounded border">{"{amount}"}</code>
                  <code className="bg-background px-1 py-0.2 rounded border">{"{month}"}</code>
                  <code className="bg-background px-1 py-0.2 rounded border">{"{magic_link}"}</code>
                </div>
                {/* Live Preview Box */}
                <div className="bg-background border border-emerald-600/20 rounded-lg p-2.5 text-xs font-mono text-emerald-950 dark:text-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                    {language === 'bn' ? 'প্রিভিউ (সদস্যের মোবাইলে যেমন দেখাবে):' : 'Live Preview:'}
                  </span>
                  <p className="whitespace-pre-wrap text-[11px] leading-relaxed">
                    {previewTemplateText}
                  </p>
                </div>
              </div>
            )}

            {/* Progress Bar during sending */}
            {sendingProgress && (
              <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border/60">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{language === 'bn' ? 'রিমাইন্ডার পাঠানো হচ্ছে...' : 'Sending reminders...'}</span>
                  <span className="font-mono text-emerald-600">{sendingProgress.current} / {sendingProgress.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#0B6B3A] h-full transition-all duration-300"
                    style={{ width: `${(sendingProgress.current / Math.max(sendingProgress.total, 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/40">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsReminderDialogOpen(false)}
              disabled={isSendingReminders}
              className="rounded-xl h-9 text-xs"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button 
              type="button"
              onClick={handleSendManualReminders}
              disabled={isSendingReminders || selectedMemberIds.length === 0}
              className="bg-[#0B6B3A] hover:bg-[#09542e] text-white font-bold text-xs rounded-xl shadow-md gap-2 h-9 px-5 cursor-pointer"
            >
              {isSendingReminders ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {language === 'bn' 
                  ? `${selectedMemberIds.length} জনকে রিমাইন্ডার পাঠান` 
                  : `Send to ${selectedMemberIds.length} Members`}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automated SMS & Push Reminder Setup Dialog */}
      <DuesReminderSetupDialog
        open={isAutoReminderSetupOpen}
        onOpenChange={setIsAutoReminderSetupOpen}
        unpaidSummary={memberDuesSummary}
      />
    </div>
  );
};

export default DuesManagement;
