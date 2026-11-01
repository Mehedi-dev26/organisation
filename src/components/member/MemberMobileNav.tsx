import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, CreditCard, User, Key, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const MemberMobileNav = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    {
      id: 'dashboard',
      url: '/member',
      exact: true,
      icon: LayoutDashboard,
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
    },
    {
      id: 'dues',
      url: '/member/dues',
      exact: false,
      icon: CreditCard,
      labelBn: 'চাঁদা',
      labelEn: 'Dues',
    },
    {
      id: 'profile',
      url: '/member/profile',
      exact: false,
      icon: User,
      labelBn: 'প্রোফাইল',
      labelEn: 'Profile',
    },
    {
      id: 'security',
      url: '/member/security',
      exact: false,
      icon: Key,
      labelBn: 'পাসওয়ার্ড',
      labelEn: 'Password',
    },
  ];

  const isItemActive = (url: string, exact: boolean) => {
    if (exact) {
      return location.pathname === url || location.pathname === '/member-dashboard';
    }
    return location.pathname.startsWith(url);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.url, item.exact);

          return (
            <NavLink
              key={item.id}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200",
                isActive
                  ? "text-[#0B6B3A] font-bold"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive && "bg-[#E6F4EA] text-[#0B6B3A]"
              )}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] mt-0.5 truncate">
                {language === 'bn' ? item.labelBn : item.labelEn}
              </span>
            </NavLink>
          );
        })}

        {/* Logout action */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-400 hover:text-rose-600 transition-all font-medium"
        >
          <div className="p-1.5 rounded-xl hover:bg-rose-50 transition-all">
            <LogOut className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[10px] mt-0.5 truncate">
            {language === 'bn' ? 'লগআউট' : 'Logout'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MemberMobileNav;
