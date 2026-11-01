import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Loader2, 
  Eye, 
  EyeOff, 
  UserCheck, 
  UserX, 
  Trash2, 
  Users, 
  Wallet, 
  Shield, 
  Sliders, 
  ArrowUpRight, 
  ShieldCheck, 
  ExternalLink,
  CheckCircle2,
  DollarSign,
  Receipt,
  FileCheck,
  Calendar,
  Layers,
  Heart
} from 'lucide-react';
import { useMultiTableRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface TeamCashier {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  roles?: string[];
  permissions?: string[];
}

interface AccessModule {
  id: string;
  labelBn: string;
  labelEn: string;
  category: 'cashier' | 'additional';
  descriptionBn: string;
  icon: React.ElementType;
}

const ACCESS_MODULES: AccessModule[] = [
  // Cashier Core Modules
  {
    id: 'finance_manage',
    labelBn: 'আর্থিক লেনদেন এন্ট্রি',
    labelEn: 'Financial Transactions',
    category: 'cashier',
    descriptionBn: 'আয় ও ব্যয়ের দৈনন্দিন হিসাব এন্ট্রি ও সম্পাদন',
    icon: Wallet,
  },
  {
    id: 'dues_collection',
    labelBn: 'মাসিক চাঁদা আদায়',
    labelEn: 'Monthly Dues Collection',
    category: 'cashier',
    descriptionBn: 'সদস্যদের চাঁদা কালেকশন ও রসিদ প্রস্তুত',
    icon: Receipt,
  },
  {
    id: 'payment_verify',
    labelBn: 'অনলাইন পেমেন্ট যাচাই',
    labelEn: 'Payment Verification',
    category: 'cashier',
    descriptionBn: 'অনলাইন চাঁদা ও অনুদান পেমেন্ট অনুমোদন',
    icon: FileCheck,
  },
  {
    id: 'yearly_reports',
    labelBn: 'বার্ষিক হিসাব ও ব্যালেন্স',
    labelEn: 'Yearly Accounts & Balance',
    category: 'cashier',
    descriptionBn: 'মাসভিত্তিক আর্থিক বিবরণী ও ব্যালেন্স নিরীক্ষা',
    icon: Calendar,
  },
  // Additional System Modules
  {
    id: 'members_verify',
    labelBn: 'সদস্য আবেদন ও অনুমোদন',
    labelEn: 'Member Verification',
    category: 'additional',
    descriptionBn: 'নতুন সদস্য আবেদন অনুমোদন ও সদস্য তালিকা নিয়ন্ত্রণ',
    icon: Users,
  },
  {
    id: 'blood_donors',
    labelBn: 'রক্তদাতা ও সেবা পরিচালনা',
    labelEn: 'Blood Donors Management',
    category: 'additional',
    descriptionBn: 'রক্তদাতা ডাটাবেস ও জরুরি রক্তের অনুরোধ পরিচালনা',
    icon: Heart,
  },
  {
    id: 'notices_content',
    labelBn: 'সংবাদ ও জরুরি নোটিশ',
    labelEn: 'News & Announcements',
    category: 'additional',
    descriptionBn: 'ফাউন্ডেশনের নোটিশ, সংবাদ ও কার্যক্রম প্রকাশ',
    icon: Layers,
  },
  {
    id: 'gallery_manage',
    labelBn: 'গ্যালারি ও ইভেন্ট অ্যালবাম',
    labelEn: 'Gallery & Event Photos',
    category: 'additional',
    descriptionBn: 'ইভেন্ট ও সমাজসেবামূলক কাজের ছবি আপলোড',
    icon: ExternalLink,
  },
];

const CASHIER_DEFAULT_PERMISSIONS = ['finance_manage', 'dues_collection', 'payment_verify', 'yearly_reports'];
const MODERATOR_DEFAULT_PERMISSIONS = ['members_verify', 'blood_donors', 'notices_content', 'gallery_manage'];
const ADMIN_DEFAULT_PERMISSIONS = ACCESS_MODULES.map(m => m.id);

const CashierManagement = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'cashier' | 'moderator' | 'admin'>('cashier');
  const [permissions, setPermissions] = useState<string[]>(CASHIER_DEFAULT_PERMISSIONS);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  // Real-time subscriptions for team & cashier changes
  const subscriptionTables = React.useMemo(() => [
    { table: 'cashiers' as const, queryKeys: [['team-cashiers'], ['cashiers']] },
    { table: 'activity_logs' as const, queryKeys: [['activity-logs']] },
  ], []);

  useMultiTableRealtimeSubscription(subscriptionTables);

  // Fetch team & cashier members with their roles
  const { data: teamMembers, isLoading: teamLoading } = useQuery({
    queryKey: ['team-cashiers'],
    queryFn: async () => {
      const { data: cashiersData, error } = await supabase
        .from('cashiers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const userIds = cashiersData.map(c => c.user_id).filter(Boolean);
      const rolesMap: Record<string, string[]> = {};

      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        rolesData?.forEach((r) => {
          if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
          rolesMap[r.user_id].push(r.role);
        });
      }

      return cashiersData.map((c) => ({
        ...c,
        roles: rolesMap[c.user_id] || ['cashier'],
      })) as TeamCashier[];
    },
    enabled: isAdmin,
    refetchInterval: 5000,
  });

  // Fetch system-wide role counts
  const { data: rolesCount } = useQuery({
    queryKey: ['team-roles-count'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('role');
      const counts = { total: 0, admin: 0, moderator: 0, cashier: 0 };
      data?.forEach(r => {
        counts.total++;
        if (r.role === 'admin') counts.admin++;
        else if (r.role === 'moderator') counts.moderator++;
        else if (r.role === 'cashier') counts.cashier++;
      });
      return counts;
    },
    enabled: isAdmin,
    refetchInterval: 5000,
  });

  // Role selector with smart automatic module pre-selection
  const handleRoleSelect = (role: 'cashier' | 'moderator' | 'admin') => {
    setSelectedRole(role);
    if (role === 'cashier') {
      setPermissions(CASHIER_DEFAULT_PERMISSIONS);
    } else if (role === 'moderator') {
      setPermissions(MODERATOR_DEFAULT_PERMISSIONS);
    } else if (role === 'admin') {
      setPermissions(ADMIN_DEFAULT_PERMISSIONS);
    }
  };

  const handleTogglePermission = (permId: string) => {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Create team / cashier user mutation
  const createCashierMutation = useMutation({
    mutationFn: async (data: typeof formData & { role: string; permissions: string[] }) => {
      const response = await supabase.functions.invoke('create-cashier-user', {
        body: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone,
          role: data.role,
          permissions: data.permissions,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-cashiers'] });
      queryClient.invalidateQueries({ queryKey: ['team-roles-count'] });
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'টিম সদস্য অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে' : 'Team account created successfully',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('cashiers')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-cashiers'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'স্ট্যাটাস আপডেট হয়েছে' : 'Status updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete team / cashier member mutation
  const deleteCashierMutation = useMutation({
    mutationFn: async ({ cashierId, userId }: { cashierId: string; userId: string }) => {
      const response = await supabase.functions.invoke('delete-cashier-user', {
        body: { cashierId, userId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to delete member');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-cashiers'] });
      queryClient.invalidateQueries({ queryKey: ['team-roles-count'] });
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'সদস্য মুছে ফেলা হয়েছে' : 'Member deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
    });
    setSelectedRole('cashier');
    setPermissions(CASHIER_DEFAULT_PERMISSIONS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    createCashierMutation.mutate({
      ...formData,
      role: selectedRole,
      permissions,
    });
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="rounded-[24px]">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {language === 'bn' ? 'অ্যাক্সেস অস্বীকৃত' : 'Access denied'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Real live metrics
  const totalMembersCount = teamMembers?.length || 0;
  const activeCashiersCount = teamMembers?.filter((c) => c.is_active && (c.roles?.includes('cashier') || true)).length || 0;
  const adminModeratorCount = (rolesCount?.admin || 1) + (rolesCount?.moderator || 0);

  const cashierModules = ACCESS_MODULES.filter(m => m.category === 'cashier');
  const additionalModules = ACCESS_MODULES.filter(m => m.category === 'additional');

  return (
    <div className="space-y-4 sm:space-y-4.5 pb-10">
      {/* 1. Signature Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'bn' ? 'টিম ও রোল পারমিশন' : 'Team & Role Permissions'}</span>
          </div>
          <div className="mt-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#14231B] font-heading tracking-tight leading-tight">
              {language === 'bn' ? 'টিম ও ক্যাশিয়ার ব্যবস্থাপনা' : 'Team & Cashier Management'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'bn' 
                ? 'ক্যাশিয়ার, মডারেটর ও প্রশাসনিক সদস্যদের বিভিন্ন প্যানেলের অ্যাক্সেস নিয়ন্ত্রণ করুন' 
                : 'Manage cashiers, moderators and team access across panels'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/cashier"
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
          >
            <Wallet className="w-3.5 h-3.5 text-[#059669]" />
            <span>{language === 'bn' ? 'ক্যাশিয়ার প্যানেল' : 'Cashier Panel'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          {/* Modal with Smooth Scrolling (never overflows or cuts off) */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-4 py-2 font-bold text-xs gap-2 bg-[#0B6B3A] hover:bg-[#09572E] text-white shadow-sm hover:shadow-md transition-all">
                <Plus className="w-4 h-4" />
                {language === 'bn' ? 'নতুন টিম সদস্য' : 'Add Team Member'}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[85vh] flex flex-col p-0 rounded-[24px] overflow-hidden bg-white shadow-2xl">
              <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 shrink-0">
                <DialogTitle className="text-lg font-bold font-heading text-[#14231B]">
                  {language === 'bn' ? 'নতুন টিম সদস্য বা ক্যাশিয়ার তৈরি' : 'Add Team Member / Cashier'}
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'bn' ? 'সদস্যের তথ্য পূরণ করে দায়িত্ব ও প্যানেল অ্যাক্সেস নির্ধারণ করুন' : 'Fill info and assign role permissions'}
                </p>
              </DialogHeader>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4 flex-1">
                <form id="team-member-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">
                      {language === 'bn' ? 'পুরো নাম' : 'Full Name'} *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder={language === 'bn' ? 'যেমন: মোঃ মেহেদী হাসান' : 'Enter name'}
                      className="rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                        {language === 'bn' ? 'ইমেইল' : 'Email'} *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="cashier@batighor.org"
                        className="rounded-xl text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
                        {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        className="rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                      {language === 'bn' ? 'লগইন পাসওয়ার্ড' : 'Login Password'} *
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="rounded-xl text-sm pr-10"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'At least 6 characters.'}
                    </p>
                  </div>

                  {/* Primary Role Selector */}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-bold text-slate-700">
                      {language === 'bn' ? 'মূল দায়িত্ব / রোল নির্বাচন করুন' : 'Assign Primary Role'} *
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoleSelect('cashier')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          selectedRole === 'cashier'
                            ? 'border-[#0B6B3A] bg-[#E6F4EA] text-[#0B6B3A] ring-2 ring-[#0B6B3A]/30 font-black'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Wallet className="w-4 h-4" />
                        <span>{language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}</span>
                        <span className="text-[9px] font-normal text-slate-400">আর্থিক হিসাব</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleSelect('moderator')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          selectedRole === 'moderator'
                            ? 'border-[#7C3AED] bg-[#F3E8FF] text-[#7C3AED] ring-2 ring-[#7C3AED]/30 font-black'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        <span>{language === 'bn' ? 'মডারেটর' : 'Moderator'}</span>
                        <span className="text-[9px] font-normal text-slate-400">যাচাই ও সেবা</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleSelect('admin')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          selectedRole === 'admin'
                            ? 'border-[#D97706] bg-[#FEF3C7] text-[#D97706] ring-2 ring-[#D97706]/30 font-black'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{language === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
                        <span className="text-[9px] font-normal text-slate-400">পূর্ণ নিয়ন্ত্রণ</span>
                      </button>
                    </div>
                  </div>

                  {/* Cashier Specific Default Modules */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-[#0B6B3A]" />
                        <span>{language === 'bn' ? 'ক্যাশিয়ার প্যানেল মডিউল অ্যাক্সেস' : 'Cashier Desk Modules'}</span>
                      </Label>
                      <span className="text-[10px] text-slate-400">
                        {language === 'bn' ? 'স্বয়ংক্রিয় নির্বাচন (কাস্টমাইজ যোগ্য)' : 'Auto-selected'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {cashierModules.map((m) => {
                        const Icon = m.icon;
                        const isChecked = permissions.includes(m.id);

                        return (
                          <label
                            key={m.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'border-[#C8E6C9] bg-[#E6F4EA]/70 text-[#0B6B3A] shadow-2xs font-bold'
                                : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100'
                            }`}
                            onClick={() => handleTogglePermission(m.id)}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded text-[#0B6B3A] focus:ring-[#0B6B3A]"
                              checked={isChecked}
                              onChange={() => {}}
                            />
                            <div className="min-w-0">
                              <p className="text-xs truncate">{m.labelBn}</p>
                              <p className="text-[10px] text-slate-400 font-normal leading-tight">{m.descriptionBn}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Feature Modules (can be checked/unchecked) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>{language === 'bn' ? 'অতিরিক্ত কাস্টম পারমিশন মডিউল' : 'Additional Custom Access'}</span>
                      </Label>
                      <span className="text-[10px] text-slate-400">
                        {language === 'bn' ? 'প্রয়োজনমতো যুক্ত/বাতিল করুন' : 'Toggle as needed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {additionalModules.map((m) => {
                        const isChecked = permissions.includes(m.id);

                        return (
                          <label
                            key={m.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'border-purple-200 bg-[#F3E8FF]/70 text-[#7C3AED] shadow-2xs font-bold'
                                : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100'
                            }`}
                            onClick={() => handleTogglePermission(m.id)}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                              checked={isChecked}
                              onChange={() => {}}
                            />
                            <div className="min-w-0">
                              <p className="text-xs truncate">{m.labelBn}</p>
                              <p className="text-[10px] text-slate-400 font-normal leading-tight">{m.descriptionBn}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </form>
              </div>

              {/* Pinned Bottom Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button 
                  form="team-member-form"
                  type="submit" 
                  className="rounded-xl bg-[#0B6B3A] hover:bg-[#09572E] text-white font-bold text-xs px-5" 
                  disabled={createCashierMutation.isPending}
                >
                  {createCashierMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {language === 'bn' ? 'টিম সদস্য তৈরি করুন' : 'Create Member'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Row: 4 Main Activity Stat Cards (Compact height, real live data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: মোট টিম সদস্য */}
        <div className="group bg-white rounded-[18px] py-3 px-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-4 pointer-events-none overflow-hidden opacity-70">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#3B82F6]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 min-w-0 z-10">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5 stroke-[2.2] text-[#2563EB]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 truncate">
                {language === 'bn' ? 'মোট টিম সদস্য' : 'Total Staff'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {totalMembersCount}
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shrink-0 z-10">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 2: সক্রিয় ক্যাশিয়ার */}
        <div className="group bg-white rounded-[18px] py-3 px-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-4 pointer-events-none overflow-hidden opacity-70">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#059669]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 min-w-0 z-10">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] flex items-center justify-center shrink-0 shadow-2xs">
              <Wallet className="w-5 h-5 stroke-[2.2] text-[#059669]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 truncate">
                {language === 'bn' ? 'সক্রিয় ক্যাশিয়ার' : 'Active Cashiers'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {activeCashiersCount}
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#E6F4EA] text-[#059669] flex items-center justify-center shrink-0 z-10">
            <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 3: মডারেটর ও অ্যাডমিন */}
        <div className="group bg-white rounded-[18px] py-3 px-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-4 pointer-events-none overflow-hidden opacity-70">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#7C3AED]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 min-w-0 z-10">
            <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] flex items-center justify-center shrink-0 shadow-2xs">
              <Shield className="w-5 h-5 stroke-[2.2] text-[#7C3AED]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 truncate">
                {language === 'bn' ? 'মডারেটর ও অ্যাডমিন' : 'Admins & Mods'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {adminModeratorCount}
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0 z-10">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 4: কাস্টম রোল পারমিশন */}
        <div className="group bg-white rounded-[18px] py-3 px-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-4 pointer-events-none overflow-hidden opacity-70">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#F59E0B]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 min-w-0 z-10">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0 shadow-2xs">
              <Sliders className="w-5 h-5 stroke-[2.2] text-[#D97706]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 truncate">
                {language === 'bn' ? 'কাস্টম পারমিশন' : 'Role Permissions'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                ৮টি মডিউল
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 z-10">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 3. Team Members Table */}
      <Card className="rounded-[22px] border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-black text-slate-900 font-heading">
            {language === 'bn' ? 'টিম সদস্য ও ক্যাশিয়ার তালিকা' : 'Team Members & Cashier Roster'}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {language === 'bn' ? `মোট: ${totalMembersCount} জন` : `Total: ${totalMembersCount}`}
          </span>
        </div>
        <CardContent className="p-0">
          {teamLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-7 w-7 animate-spin text-[#0B6B3A]" />
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 border-slate-100">
                    <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'সদস্যের নাম' : 'Member Name'}</TableHead>
                    <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'ইমেইল ও ফোন' : 'Contact'}</TableHead>
                    <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'নির্ধারিত রোল' : 'Role'}</TableHead>
                    <TableHead className="font-bold text-slate-600 text-xs">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                    <TableHead className="text-right font-bold text-slate-600 text-xs">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => {
                    const isCashierRole = member.roles?.includes('cashier');
                    const isModRole = member.roles?.includes('moderator');
                    const isAdminRole = member.roles?.includes('admin');

                    return (
                      <TableRow key={member.id} className="hover:bg-slate-50/60 border-slate-100">
                        <TableCell className="font-bold text-slate-900 text-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#E6F4EA] text-[#0B6B3A] flex items-center justify-center font-black text-xs shrink-0 aspect-square">
                              {member.full_name?.charAt(0) || 'T'}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs sm:text-sm">{member.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-normal">
                                {new Date(member.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          <p className="font-medium text-slate-700">{member.email}</p>
                          <p className="text-slate-400">{member.phone || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isAdminRole && (
                              <Badge className="bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7] border-amber-200 text-[10px] font-bold">
                                {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
                              </Badge>
                            )}
                            {isModRole && (
                              <Badge className="bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#F3E8FF] border-purple-200 text-[10px] font-bold">
                                {language === 'bn' ? 'মডারেটর' : 'Moderator'}
                              </Badge>
                            )}
                            {isCashierRole && (
                              <Badge className="bg-[#E6F4EA] text-[#0B6B3A] hover:bg-[#E6F4EA] border-[#C8E6C9] text-[10px] font-bold">
                                {language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold ${
                              member.is_active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            {member.is_active 
                              ? (language === 'bn' ? 'সক্রিয়' : 'Active')
                              : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-lg h-8 w-8 p-0"
                              onClick={() => toggleActiveMutation.mutate({ 
                                id: member.id, 
                                isActive: !member.is_active 
                              })}
                              title={member.is_active 
                                ? (language === 'bn' ? 'নিষ্ক্রিয় করুন' : 'Deactivate')
                                : (language === 'bn' ? 'সক্রিয় করুন' : 'Activate')}
                            >
                              {member.is_active 
                                ? <UserX className="h-4 w-4 text-rose-500" />
                                : <UserCheck className="h-4 w-4 text-emerald-600" />}
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-lg h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                                  title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-[24px]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-heading font-bold text-lg">
                                    {language === 'bn' ? 'টিম সদস্য মুছে ফেলুন?' : 'Delete Team Member?'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-500 text-sm">
                                    {language === 'bn' 
                                      ? `আপনি কি "${member.full_name}" কে মুছে ফেলতে চান? এটি তার সমস্ত অ্যাক্সেস প্রত্যাহার করবে।`
                                      : `Are you sure you want to delete "${member.full_name}"? This will revoke all their permissions.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">
                                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCashierMutation.mutate({
                                      cashierId: member.id,
                                      userId: member.user_id
                                    })}
                                    className="bg-destructive hover:bg-destructive/90 text-white rounded-xl"
                                  >
                                    {deleteCashierMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    {language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <Users className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
              <p className="text-xs font-medium">
                {language === 'bn' ? 'কোনো টিম সদস্য বা ক্যাশিয়ার পাওয়া যায়নি' : 'No team members or cashiers found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashierManagement;
