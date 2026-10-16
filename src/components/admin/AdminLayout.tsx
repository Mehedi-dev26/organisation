import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, isUserAdmin } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import { AdminNoticeSheet } from './AdminNoticeSheet';
import {
  Loader2,
  Bell,
  ChevronDown,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Settings,
  Users,
  ExternalLink,
  Mail,
  Phone,
  BadgeCheck,
  Sparkles,
  ShieldAlert,
  Building2,
  Lock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const AdminLayout = () => {
  const { user, isAdmin, loading, rolesLoading, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const isAuthLoading = loading || rolesLoading;
  const effectiveIsAdmin = isAdmin || isUserAdmin(user);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!effectiveIsAdmin) {
        navigate('/');
      }
    }
  }, [user, effectiveIsAdmin, isAuthLoading, navigate]);

  // Query real-time pending items count for notification bell badge
  const { data: pendingMembersCount = 0 } = useQuery({
    queryKey: ['admin-badge-pending-members'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 15000,
  });

  const { data: pendingPaymentsCount = 0 } = useQuery({
    queryKey: ['admin-badge-pending-payments'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('member_dues')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'submitted')
        .eq('is_paid', false);
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 15000,
  });

  const totalNoticeCount = (pendingMembersCount || 0) + (pendingPaymentsCount || 0);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !effectiveIsAdmin) {
    return null;
  }

  // Derive readable header title based on current path
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard';
    if (path.includes('members')) return language === 'bn' ? 'সদস্য ব্যবস্থাপনা' : 'Members';
    if (path.includes('blood-donors')) return language === 'bn' ? 'রক্তদান ব্যবস্থাপনা' : 'Blood Donors';
    if (path.includes('events')) return language === 'bn' ? 'ইভেন্ট ব্যবস্থাপনা' : 'Events';
    if (path.includes('committee')) return language === 'bn' ? 'কমিটি ব্যবস্থাপনা' : 'Committee';
    if (path.includes('finance')) return language === 'bn' ? 'আর্থিক ব্যবস্থাপনা' : 'Finance';
    if (path.includes('dues')) return language === 'bn' ? 'মাসিক চাঁদা' : 'Dues';
    if (path.includes('payment-verification')) return language === 'bn' ? 'পেমেন্ট ভেরিফাই' : 'Payment Verification';
    if (path.includes('yearly-accounts')) return language === 'bn' ? 'বিভিন্ন হিসাব নিকাশ' : 'Yearly Accounts';
    if (path.includes('cashiers')) return language === 'bn' ? 'ক্যাশিয়ার ব্যবস্থাপনা' : 'Cashiers';
    if (path.includes('settings')) return language === 'bn' ? 'সেটিংস' : 'Settings';
    if (path.includes('gallery')) return language === 'bn' ? 'গ্যালারি ও রিপোর্ট' : 'Gallery & Reports';
    if (path.includes('news')) return language === 'bn' ? 'সংবাদ ব্যবস্থাপনা' : 'News';
    return language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel';
  };

  const displayName = 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] || 
    'Md Mehedi Hasan';

  const userPhone = 
    user?.phone || 
    user?.user_metadata?.phone || 
    '০১৯১৬৩১৪৩১৫';

  const userEmail = user?.email || 'mehedihasanwork25@mail.com';

  return (
    <SidebarProvider style={{ "--sidebar-width": "270px" } as React.CSSProperties}>
      <div className="min-h-screen flex w-full bg-[#F4FAF6]">
        <AdminSidebar />
        <SidebarInset className="flex-1 bg-[#F4FAF6] overflow-x-hidden min-w-0">
          {/* Header Bar matching reference image */}
          <header className="h-16 border-b border-emerald-950/10 flex items-center justify-between px-4 sm:px-6 md:px-8 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-xs">
            {/* Left: Sidebar trigger & Title */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg p-2 transition-colors" />
              <h1 className="font-heading font-extrabold text-lg sm:text-xl text-slate-800 tracking-tight">
                {getHeaderTitle()}
              </h1>
            </div>

            {/* Right: Notifications & User Profile */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Real-time Notification Bell with Dynamic Counter */}
              <button 
                type="button"
                onClick={() => setIsNoticeOpen(true)}
                className="relative p-2.5 rounded-full hover:bg-emerald-50 text-slate-600 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                aria-label="Real-time Notifications and Notices"
                title={language === 'bn' ? 'রিয়েলটাইম নোটিশ ও অ্যাক্টিভিটি' : 'Live Notices & Activity'}
              >
                <Bell className="w-5 h-5 text-slate-700 group-hover:text-emerald-700 transition-colors" />
                {totalNoticeCount > 0 ? (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {totalNoticeCount > 99 ? '99+' : totalNoticeCount}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>

              {/* User Avatar & Name with Comprehensive Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    type="button"
                    className="flex items-center gap-2.5 pl-3 border-l border-slate-200 hover:opacity-90 transition-all cursor-pointer text-left focus:outline-none group rounded-lg py-1 px-1.5 hover:bg-slate-50"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-emerald-500/30 overflow-hidden flex-shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold leading-none mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'bn' ? 'সুপার অ্যাডমিন' : 'Super Admin'}</span>
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 hidden sm:block transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border border-slate-200/80 p-1.5 z-50 bg-white animate-in fade-in-50 zoom-in-95">
                  {/* Profile Header Summary */}
                  <div className="px-3 py-3 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-emerald-100/80 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center font-bold text-base shadow-sm ring-2 ring-emerald-600/20">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {userEmail}
                        </p>
                        <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-emerald-100/80 text-[10px] font-bold text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{language === 'bn' ? 'সক্রিয় সেশন' : 'Online'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1">
                    {language === 'bn' ? 'অ্যাকাউন্ট ও ব্যবস্থাপনা' : 'Account & Controls'}
                  </DropdownMenuLabel>

                  {/* Option 1: Profile View Modal */}
                  <DropdownMenuItem 
                    onClick={() => setIsProfileDialogOpen(true)}
                    className="cursor-pointer font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-xl py-2 px-3 flex items-center gap-2.5 text-xs transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-700">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{language === 'bn' ? 'প্রোফাইল বিবরণ' : 'Profile Details'}</p>
                      <p className="text-[10px] text-slate-400">{language === 'bn' ? 'সম্পূর্ণ তথ্য ও ক্ষমতা দেখুন' : 'View account privileges'}</p>
                    </div>
                  </DropdownMenuItem>

                  {/* Option 2: Settings & Profile Edit */}
                  <DropdownMenuItem 
                    onClick={() => navigate('/admin/settings')}
                    className="cursor-pointer font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-xl py-2 px-3 flex items-center gap-2.5 text-xs transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-700">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{language === 'bn' ? 'সেটিংস ও এডিট' : 'Settings & Edit'}</p>
                      <p className="text-[10px] text-slate-400">{language === 'bn' ? 'সাইট ও অ্যাডমিন কনফিগ' : 'System configurations'}</p>
                    </div>
                  </DropdownMenuItem>

                  {/* Option 3: Member Approval & Requests */}
                  <DropdownMenuItem 
                    onClick={() => navigate('/admin/members')}
                    className="cursor-pointer font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-xl py-2 px-3 flex items-center gap-2.5 text-xs transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-700">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{language === 'bn' ? 'সদস্য তালিকা ও অনুমোদন' : 'Manage Members'}</p>
                      <p className="text-[10px] text-slate-400">{language === 'bn' ? 'নতুন আবেদন ও স্ট্যাটাস' : 'Verification & members'}</p>
                    </div>
                  </DropdownMenuItem>

                  {/* Option 4: View Public Website */}
                  <DropdownMenuItem 
                    onClick={() => navigate('/')}
                    className="cursor-pointer font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-xl py-2 px-3 flex items-center gap-2.5 text-xs transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-700">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{language === 'bn' ? 'ওয়েবসাইট দেখুন' : 'View Website'}</p>
                      <p className="text-[10px] text-slate-400">{language === 'bn' ? 'লাইভ পাবলিক ইন্টারফেস' : 'Public homepage'}</p>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

                  {/* Option 5: Logout */}
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer font-bold py-2.5 px-3 rounded-xl flex items-center gap-2.5 text-xs transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-rose-600">{language === 'bn' ? 'লগআউট' : 'Logout'}</p>
                      <p className="text-[10px] text-rose-400">{language === 'bn' ? 'সেশন শেষ করে প্রস্থান' : 'Sign out from admin'}</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Dashboard / Page Body */}
          <main className="p-4 sm:p-6 lg:p-8 bg-[#F4FAF6] min-h-[calc(100vh-4rem)]">
            <Outlet />
          </main>
        </SidebarInset>
      </div>

      {/* Slide-out Real-time Notice Sheet */}
      <AdminNoticeSheet open={isNoticeOpen} onOpenChange={setIsNoticeOpen} />

      {/* Admin Profile Details Dialog Modal */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-emerald-900/10 shadow-2xl bg-white">
          {/* Top Emerald Banner */}
          <div className="bg-gradient-to-br from-[#09351D] via-[#0B6B3A] to-teal-800 p-6 text-white relative">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white text-emerald-800 font-extrabold text-2xl flex items-center justify-center shadow-lg ring-4 ring-white/20 flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-[11px] font-bold text-amber-200 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'bn' ? 'সুপার অ্যাডমিনিস্ট্রেটর' : 'Super Administrator'}</span>
                </div>
                <h3 className="text-xl font-heading font-extrabold text-white leading-tight truncate">
                  {displayName}
                </h3>
                <p className="text-xs text-emerald-100/90 font-medium truncate mt-0.5">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">{language === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{userPhone}</p>
                </div>
              </div>

              {/* Status */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">{language === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Status'}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{language === 'bn' ? 'সক্রিয় ও ভেরিফাইড' : 'Active & Verified'}</span>
                  </p>
                </div>
              </div>

              {/* Security / Role */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">{language === 'bn' ? 'অ্যাক্সেস লেভেল' : 'Access Level'}</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{language === 'bn' ? 'সর্বোচ্চ ক্ষমতা (Full)' : 'Full System Access'}</p>
                </div>
              </div>

              {/* Organization */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">{language === 'bn' ? 'সংগঠন' : 'Organisation'}</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{language === 'bn' ? 'সময়ের বাতিঘর' : 'Somoyer Batighor'}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer inside modal */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsProfileDialogOpen(false);
                  navigate('/admin/settings');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B6B3A] hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>{language === 'bn' ? 'প্রোফাইল ও সেটিংস সম্পাদনা করুন' : 'Edit Profile & Settings'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfileDialogOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminLayout;

