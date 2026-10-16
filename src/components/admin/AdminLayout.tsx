import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import { Loader2, Bell, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AdminLayout = () => {
  const { user, isAdmin, loading, rolesLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthLoading = loading || rolesLoading;

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        // Non-admin users cannot access admin panel
        navigate('/');
      }
    }
  }, [user, isAdmin, isAuthLoading, navigate]);

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

  if (!user || !isAdmin) {
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

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Md Mehedi Hasan';

  return (
    <SidebarProvider style={{ "--sidebar-width": "270px" } as React.CSSProperties}>
      <div className="min-h-screen flex w-full bg-[#F4FAF6]">
        <AdminSidebar />
        <SidebarInset className="flex-1 bg-[#F4FAF6] overflow-x-hidden min-w-0">
          {/* Header Bar matching reference image */}
          <header className="h-16 border-b border-emerald-950/10 flex items-center justify-between px-4 sm:px-6 md:px-8 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-xs">
            {/* Left: Sidebar trigger & Title */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg p-2" />
              <h1 className="font-heading font-extrabold text-lg sm:text-xl text-slate-800 tracking-tight">
                {getHeaderTitle()}
              </h1>
            </div>

            {/* Right: Notifications & User Profile */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Notification Bell with Badge 1 */}
              <button 
                type="button"
                className="relative p-2 rounded-full hover:bg-emerald-50 text-slate-600 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  1
                </span>
              </button>

              {/* User Avatar & Name with Dropdown Menu (Only Logout option) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    type="button"
                    className="flex items-center gap-2.5 pl-3 border-l border-slate-200 hover:opacity-85 transition-opacity cursor-pointer text-left focus:outline-none"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-sm shadow-xs overflow-hidden flex-shrink-0">
                      <UserIcon className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium leading-none mt-0.5">
                        {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border border-slate-200">
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer font-semibold py-2.5 px-3 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
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
    </SidebarProvider>
  );
};

export default AdminLayout;
