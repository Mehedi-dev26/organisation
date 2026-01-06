import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutDashboard, Wallet, Receipt, History, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CashierMobileNav = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { 
      href: '/cashier', 
      icon: LayoutDashboard, 
      label: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard',
      exact: true
    },
    { 
      href: '/cashier/finance', 
      icon: Wallet, 
      label: language === 'bn' ? 'আর্থিক' : 'Finance',
      exact: false
    },
    { 
      href: '/cashier/dues', 
      icon: Receipt, 
      label: language === 'bn' ? 'বকেয়া' : 'Dues',
      exact: false
    },
    { 
      href: '/cashier/yearly-accounts', 
      icon: History, 
      label: language === 'bn' ? 'বছরের হিসাব' : 'Yearly',
      exact: false
    },
  ];

  const isActive = (path: string, exact: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(language === 'bn' ? 'সফলভাবে লগআউট হয়েছে' : 'Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error(language === 'bn' ? 'লগআউট করতে সমস্যা হয়েছে' : 'Error logging out');
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-all duration-200",
                active 
                  ? "text-amber-600 bg-amber-50" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 mb-1 transition-transform duration-200",
                  active && "scale-110"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium truncate max-w-full",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-all duration-200 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium truncate max-w-full">
            {language === 'bn' ? 'লগআউট' : 'Logout'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default CashierMobileNav;
