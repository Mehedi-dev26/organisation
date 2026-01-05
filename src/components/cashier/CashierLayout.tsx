import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import CashierSidebar from './CashierSidebar';
import CashierMobileNav from './CashierMobileNav';
import { Loader2 } from 'lucide-react';

const CashierLayout = () => {
  const { user, loading, session } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();

  // Check if user has cashier role
  const [isCashier, setIsCashier] = React.useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = React.useState(true);

  React.useEffect(() => {
    const checkCashierRole = async () => {
      if (!user) {
        setIsCashier(false);
        setCheckingRole(false);
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'cashier')
          .maybeSingle();

        if (error) {
          console.error('Error checking cashier role:', error);
          setIsCashier(false);
        } else {
          setIsCashier(!!data);
        }
      } catch (error) {
        console.error('Error checking cashier role:', error);
        setIsCashier(false);
      }
      setCheckingRole(false);
    };

    if (!loading) {
      checkCashierRole();
    }
  }, [user, loading]);

  if (loading || checkingRole) {
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

  if (!user || !isCashier) {
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
