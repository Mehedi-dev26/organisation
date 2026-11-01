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
  DollarSign
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
}

const CashierManagement = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'cashier' | 'moderator' | 'admin'>('cashier');
  const [permissions, setPermissions] = useState<string[]>(['finance_dues']);

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
    setPermissions(['finance_dues']);
  };

  const handleTogglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
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

  const totalMembersCount = teamMembers?.length || 0;
  const activeCashiersCount = teamMembers?.filter((c) => c.is_active && (c.roles?.includes('cashier') || true)).length || 0;
  const adminModeratorCount = (rolesCount?.admin || 1) + (rolesCount?.moderator || 0);

  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      {/* 1. Signature Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'bn' ? 'টিম ও রোল পারমিশন' : 'Team & Role Permissions'}</span>
          </div>
          <div className="mt-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-[#14231B] font-heading tracking-tight leading-tight">
              {language === 'bn' ? 'টিম ও ক্যাশিয়ার ব্যবস্থাপনা' : 'Team & Cashier Management'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
          >
            <Wallet className="w-3.5 h-3.5 text-[#059669]" />
            <span>{language === 'bn' ? 'ক্যাশিয়ার প্যানেল' : 'Cashier Panel'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-4 py-2 font-bold text-xs gap-2 bg-[#0B6B3A] hover:bg-[#09572E] text-white shadow-sm hover:shadow-md transition-all">
                <Plus className="w-4 h-4" />
                {language === 'bn' ? 'নতুন টিম সদস্য' : 'Add Team Member'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[24px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold font-heading text-[#14231B]">
                  {language === 'bn' ? 'নতুন টিম সদস্য বা ক্যাশিয়ার তৈরি' : 'Add Team Member / Cashier'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'পুরো নাম' : 'Full Name'} *
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={language === 'bn' ? 'সদস্যের নাম লিখুন' : 'Enter name'}
                    className="rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'ইমেইল' : 'Email'} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="member@somoyerbatighor.org"
                    className="rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="rounded-xl text-sm"
                  />
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
                </div>

                {/* Role Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'দায়িত্ব / রোল নির্বাচন' : 'Assign Primary Role'} *
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('cashier');
                        if (!permissions.includes('finance_dues')) setPermissions([...permissions, 'finance_dues']);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        selectedRole === 'cashier'
                          ? 'border-[#0B6B3A] bg-[#E6F4EA] text-[#0B6B3A] ring-1 ring-[#0B6B3A]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span>{language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('moderator')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        selectedRole === 'moderator'
                          ? 'border-[#7C3AED] bg-[#F3E8FF] text-[#7C3AED] ring-1 ring-[#7C3AED]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>{language === 'bn' ? 'মডারেটর' : 'Moderator'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        selectedRole === 'admin'
                          ? 'border-[#D97706] bg-[#FEF3C7] text-[#D97706] ring-1 ring-[#D97706]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{language === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
                    </button>
                  </div>
                </div>

                {/* Custom Module Permissions */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-slate-700">
                    {language === 'bn' ? 'কাস্টম মডিউল অ্যাক্সেস' : 'Custom Module Access'}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'finance_dues', label: language === 'bn' ? 'আর্থিক ও চাঁদা' : 'Finance & Dues' },
                      { id: 'members_verify', label: language === 'bn' ? 'সদস্য অনুমোদন' : 'Member Verify' },
                      { id: 'blood_donors', label: language === 'bn' ? 'রক্তদান পরিচালনা' : 'Blood Donors' },
                      { id: 'notices_content', label: language === 'bn' ? 'নোটিশ ও নিউজ' : 'Notices & News' },
                    ].map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                          permissions.includes(p.id)
                            ? 'border-[#C8E6C9] bg-[#E6F4EA]/60 text-[#0B6B3A] font-bold'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                        onClick={() => handleTogglePermission(p.id)}
                      >
                        <input
                          type="checkbox"
                          className="rounded text-[#0B6B3A] focus:ring-[#0B6B3A]"
                          checked={permissions.includes(p.id)}
                          onChange={() => {}}
                        />
                        <span className="truncate">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-3 rounded-xl bg-[#0B6B3A] hover:bg-[#09572E] text-white font-bold text-sm py-2.5" 
                  disabled={createCashierMutation.isPending}
                >
                  {createCashierMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {language === 'bn' ? 'টিম সদস্য তৈরি করুন' : 'Create Team Account'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Row: 4 Main Activity Stat Cards (matching Dashboard aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: মোট টিম সদস্য */}
        <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#3B82F6]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Users className="w-6 h-6 stroke-[2.2] text-[#2563EB]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'মোট টিম সদস্য' : 'Total Team Staff'}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                {totalMembersCount}
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 2: সক্রিয় ক্যাশিয়ার */}
        <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#059669]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F4EA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Wallet className="w-6 h-6 stroke-[2.2] text-[#059669]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'সক্রিয় ক্যাশিয়ার' : 'Active Cashiers'}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                {activeCashiersCount}
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#059669] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <DollarSign className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 3: মডারেটর ও অ্যাডমিন */}
        <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#7C3AED]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Shield className="w-6 h-6 stroke-[2.2] text-[#7C3AED]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'মডারেটর ও অ্যাডমিন' : 'Admins & Mods'}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                {adminModeratorCount}
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 4: কাস্টম রোল পারমিশন */}
        <div className="group bg-white rounded-[22px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -bottom-0.5 -right-2 -left-2 h-7 pointer-events-none overflow-hidden opacity-75">
            <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full fill-[#F59E0B]">
              <path d="M0,25 C150,55 350,-5 500,25 L500,50 L0,50 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Sliders className="w-6 h-6 stroke-[2.2] text-[#D97706]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 truncate">
                {language === 'bn' ? 'কাস্টম পারমিশন' : 'Role Permissions'}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">
                ৪টি মডিউল
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 3. Team Members Table */}
      <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
            {language === 'bn' ? 'টিম সদস্য ও ক্যাশিয়ার তালিকা' : 'Team Members & Cashier Roster'}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {language === 'bn' ? `মোট: ${totalMembersCount} জন` : `Total: ${totalMembersCount}`}
          </span>
        </div>
        <CardContent className="p-0">
          {teamLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#0B6B3A]" />
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
                            <div className="w-8 h-8 rounded-full bg-[#E6F4EA] text-[#0B6B3A] flex items-center justify-center font-black text-xs shrink-0">
                              {member.full_name?.charAt(0) || 'T'}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate">{member.full_name}</p>
                              <p className="text-[11px] text-slate-400 font-normal">
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
                              <Badge className="bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7] border-amber-200 text-[11px] font-bold">
                                {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
                              </Badge>
                            )}
                            {isModRole && (
                              <Badge className="bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#F3E8FF] border-purple-200 text-[11px] font-bold">
                                {language === 'bn' ? 'মডারেটর' : 'Moderator'}
                              </Badge>
                            )}
                            {isCashierRole && (
                              <Badge className="bg-[#E6F4EA] text-[#0B6B3A] hover:bg-[#E6F4EA] border-[#C8E6C9] text-[11px] font-bold">
                                {language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-[11px] font-bold ${
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
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-2" />
              <p className="text-sm font-medium">
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
