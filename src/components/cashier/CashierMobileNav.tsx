import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutDashboard, Wallet, Receipt, CheckSquare, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const CashierMobileNav = () => {
  const { language } = useLanguage();
  const location = useLocation();

  const navItems = [
    { 
      href: '/cashier', 
      icon: LayoutDashboard, 
      label: language === 'bn' ? 'ড্যাশবোর্ড' : 'Home',
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
      label: language === 'bn' ? 'চাঁদা' : 'Dues',
      exact: false
    },
    { 
      href: '/cashier/payment-verification', 
      icon: CheckSquare, 
      label: language === 'bn' ? 'যাচাই' : 'Verify',
      exact: false
    },
    { 
      href: '/cashier/yearly-accounts', 
      icon: History, 
      label: language === 'bn' ? 'রিপোর্ট' : 'Report',
      exact: false
    },
  ];

  const isActive = (path: string, exact: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-950/10 z-50 shadow-lg safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200",
                active 
                  ? "text-[#0B6B3A] bg-[#E6F4EA] font-black" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 mb-0.5 transition-transform duration-200 stroke-[2.2]",
                  active && "scale-110 text-[#0B6B3A]"
                )} 
              />
              <span className="text-[10px] truncate max-w-full leading-tight">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default CashierMobileNav;
