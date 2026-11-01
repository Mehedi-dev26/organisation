import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import CashierSidebar from './CashierSidebar';
import CashierMobileNav from './CashierMobileNav';
import { CashierHeaderSearch } from './CashierHeaderSearch';
import { AdminNoticeSheet } from '@/components/admin/AdminNoticeSheet';
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
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Bell, 
  Wallet, 
  Receipt, 
  ExternalLink, 
  LogOut, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CashierLayout = () => {
  const { user, loading, rolesLoading, isCashier, isAdmin, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isAuthLoading = loading || rolesLoading;
  const isCachedCashier = () => {
    try {
      return (
        sessionStorage.getItem('batighor_auth_cashier') === 'true' ||
        sessionStorage.getItem('batighor_auth_admin') === 'true'
      );
    } catch {
      return false;
    }
  };

  const hasCashierAccess = isCashier || isAdmin || isCachedCashier();

  // Query live pending payment verifications count for notification badge
  const { data: pendingPaymentsCount = 0 } = useQuery({
    queryKey: ['cashier-badge-pending-payments'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('payment_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count || 0;
    },
    enabled: Boolean(hasCashierAccess),
    refetchInterval: 5000,
  });

  // Query unpaid dues count
  const { data: unpaidDuesCount = 0 } = useQuery({
    queryKey: ['cashier-badge-unpaid-dues'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('member_dues')
        .select('*', { count: 'exact', head: true })
        .eq('is_paid', false);
      if (error) return 0;
      return count || 0;
    },
    enabled: Boolean(hasCashierAccess),
    refetchInterval: 10000,
  });

  const totalNoticeCount = pendingPaymentsCount;

  if (isAuthLoading && !hasCashierAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4FAF6]">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#0B6B3A] mx-auto" />
          <p className="text-slate-600 text-sm font-semibold">
            {language === 'bn' ? 'ক্যাশিয়ার প্যানেল লোড হচ্ছে...' : 'Loading Cashier Panel...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user && !isCachedCashier()) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!hasCashierAccess) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Derive page title
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/cashier') return language === 'bn' ? 'ড্যাশবোর্ড ও আর্থিক সারসংক্ষেপ' : 'Dashboard';
    if (path.includes('finance')) return language === 'bn' ? 'আর্থিক হিসাব ব্যবস্থাপনা' : 'Finance Management';
    if (path.includes('dues')) return language === 'bn' ? 'বকেয়া চাঁদা আদায় ও রসিদ' : 'Dues Collection';
    if (path.includes('payment-verification')) return language === 'bn' ? 'অনলাইন পেমেন্ট যাচাই' : 'Payment Verification';
    if (path.includes('yearly-accounts')) return language === 'bn' ? 'বিগত বছরের হিসাব ও ব্যালেন্স' : 'Yearly Accounts';
    return language === 'bn' ? 'ক্যাশিয়ার প্যানেল' : 'Cashier Desk';
  };

  const displayName = 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] || 
    'ক্যাশিয়ার';

  const userEmail = user?.email || 'cashier@batighor.org';
  const userPhone = user?.phone || user?.user_metadata?.phone || '';

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: language === 'bn' ? 'লগআউট সম্পন্ন' : 'Logged out',
        description: language === 'bn' ? 'আপনি সফলভাবে লগআউট করেছেন' : 'You have been logged out',
      });
      navigate('/auth', { replace: true });
    } catch {
      navigate('/auth', { replace: true });
    }
  };

  return (
    <SidebarProvider style={{ "--sidebar-width": "270px" } as React.CSSProperties}>
      <div className="min-h-screen flex w-full bg-[#F4FAF6]">
        {/* Desktop Sidebar */}
        <CashierSidebar />

        <SidebarInset className="flex-1 bg-[#F4FAF6] min-w-0 flex flex-col h-screen overflow-hidden">
          {/* Permanent Sticky Top Header Bar matching Admin Panel Header */}
          <header className="h-16 shrink-0 border-b border-emerald-950/10 flex items-center justify-between px-4 sm:px-6 md:px-8 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs gap-3">
            {/* Left: Sidebar trigger & Title */}
            <div className="flex items-center gap-3 shrink-0">
              <SidebarTrigger className="text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg p-2 transition-colors cursor-pointer" />
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex p-1.5 rounded-lg bg-[#E6F4EA] text-[#0B6B3A]">
                  <Wallet className="w-4 h-4" />
                </span>
                <h1 className="font-heading font-extrabold text-base sm:text-lg lg:text-xl text-slate-800 tracking-tight whitespace-nowrap">
                  {getHeaderTitle()}
                </h1>
              </div>
            </div>

            {/* Middle: Real-time Member Search Box (Ctrl+K) */}
            <div className="flex-1 max-w-sm sm:max-w-md lg:max-w-lg mx-2 sm:mx-4 hidden md:block">
              <CashierHeaderSearch />
            </div>

            {/* Right: Notification Bell & Profile Dropdown */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Notification Bell with Live Counter */}
              <button 
                type="button"
                onClick={() => setIsNoticeOpen(true)}
                className="relative p-2.5 rounded-full hover:bg-emerald-50 text-slate-600 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                aria-label="Real-time Notifications"
                title={language === 'bn' ? 'পেমেন্ট ও চাঁদা অ্যালার্ট' : 'Payment Alerts'}
              >
                <Bell className="w-5 h-5 text-slate-700 group-hover:text-emerald-700 transition-colors" />
                {totalNoticeCount > 0 ? (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {totalNoticeCount > 99 ? '99+' : totalNoticeCount}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>

              {/* Cashier User Avatar & Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    type="button"
                    className="flex items-center gap-2.5 pl-3 border-l border-slate-200 hover:opacity-90 transition-all cursor-pointer text-left focus:outline-none group rounded-lg py-1 px-1.5 hover:bg-slate-50"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B6B3A] to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-emerald-500/30 overflow-hidden shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors truncate max-w-[130px]">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-amber-600 font-semibold leading-none mt-0.5 flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-amber-600" />
                        <span>{language === 'bn' ? 'ক্যাশিয়ার ডেস্ক' : 'Cashier Desk'}</span>
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border border-emerald-950/10 bg-white/95 backdrop-blur-md">
                  <DropdownMenuLabel className="font-normal px-2.5 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold text-slate-900 leading-none">{displayName}</p>
                      <p className="text-xs text-slate-500 leading-none truncate">{userEmail}</p>
                      {userPhone && (
                        <p className="text-[11px] text-slate-400 leading-none pt-0.5">{userPhone}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />

                  {/* Profile Modal */}
                  <DropdownMenuItem 
                    onClick={() => setIsProfileOpen(true)}
                    className="cursor-pointer py-2 px-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50"
                  >
                    <User className="w-4 h-4 mr-2 text-emerald-600" />
                    <span>{language === 'bn' ? 'আমার তথ্য ও প্রোফাইল' : 'Profile Details'}</span>
                  </DropdownMenuItem>

                  {/* Language Toggle */}
                  <DropdownMenuItem 
                    onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                    className="cursor-pointer py-2 px-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-emerald-600" />
                      <span>{language === 'bn' ? 'ভাষা পরিবর্তন' : 'Switch Language'}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {language === 'bn' ? 'EN' : 'বাং'}
                    </span>
                  </DropdownMenuItem>

                  {/* View Website */}
                  <DropdownMenuItem 
                    asChild
                    className="cursor-pointer py-2 px-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50"
                  >
                    <Link to="/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2 text-emerald-600" />
                      <span>{language === 'bn' ? 'ওয়েবসাইট দেখুন' : 'View Website'}</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Admin Switch (if admin) */}
                  {isAdmin && (
                    <DropdownMenuItem 
                      asChild
                      className="cursor-pointer py-2 px-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 focus:bg-emerald-100"
                    >
                      <Link to="/admin">
                        <ShieldCheck className="w-4 h-4 mr-2 text-[#0B6B3A]" />
                        <span>{language === 'bn' ? 'অ্যাডমিন প্যানেলে যান' : 'Go to Admin Panel'}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-slate-100" />

                  {/* Sign Out */}
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer py-2 px-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>{language === 'bn' ? 'লগআউট করুন' : 'Sign Out'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Outlet with standard Admin spacing & alignment */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 pb-20 md:pb-8">
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation */}
          <CashierMobileNav />
        </SidebarInset>

        {/* Real-time Notifications Drawer */}
        <AdminNoticeSheet 
          open={isNoticeOpen} 
          onOpenChange={setIsNoticeOpen} 
        />

        {/* Cashier Profile Info Dialog */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-emerald-900/10">
            <DialogHeader className="pb-3 border-b border-slate-100">
              <DialogTitle className="text-lg font-heading font-extrabold text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#0B6B3A]" />
                {language === 'bn' ? 'ক্যাশিয়ার অ্যাকাউন্ট বিবরণ' : 'Cashier Account Details'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="w-12 h-12 rounded-xl bg-[#0B6B3A] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{displayName}</h4>
                  <p className="text-xs text-emerald-700 font-semibold">{language === 'bn' ? 'ক্যাশিয়ার ও অর্থ বিষয়ক প্রতিনিধি' : 'Cashier & Finance Officer'}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {language === 'bn' ? 'ইমেইল' : 'Email'}
                  </span>
                  <span className="font-bold text-slate-800">{userEmail}</span>
                </div>
                {userPhone && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {language === 'bn' ? 'মোবাইল' : 'Phone'}
                    </span>
                    <span className="font-bold text-slate-800">{userPhone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0B6B3A]" />
                    {language === 'bn' ? 'প্যানেল স্ট্যাটাস' : 'Status'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#0B6B3A] font-bold text-[10px]">
                    {language === 'bn' ? 'সক্রিয়' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default CashierLayout;
