import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import CashierSidebar from './CashierSidebar';
import CashierMobileNav from './CashierMobileNav';
import { Loader2 } from 'lucide-react';

const CashierLayout = () => {
  const { user, loading, rolesLoading, isCashier, isAdmin } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();

  const isAuthLoading = loading || rolesLoading;
  const hasCashierAccess = isCashier || isAdmin;

  if (isAuthLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !hasCashierAccess) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <CashierSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <CashierMobileNav />
      </div>
    </SidebarProvider>
  );
};

export default CashierLayout;
