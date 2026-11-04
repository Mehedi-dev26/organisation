import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, CreditCard, User, Key, LogOut, Sparkles, Bell, MessageSquare } from 'lucide-react';
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
      id: 'notices',
      url: '/member/notices',
      exact: false,
      icon: Bell,
      labelBn: 'নোটিশ',
      labelEn: 'Notices',
    },
    {
      id: 'messages',
      url: '/member/messages',
      exact: false,
      icon: MessageSquare,
      labelBn: 'বার্তা',
      labelEn: 'Messages',
    },
    {
      id: 'profile',
      url: '/member/profile',
      exact: false,
      icon: User,
      labelBn: 'প্রোফাইল',
      labelEn: 'Profile',
    },
  ];

  const isItemActive = (url: string, exact: boolean) => {
    if (exact) {
      return location.pathname === url || location.pathname === '/member-dashboard';
    }
    return location.pathname.startsWith(url);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#E8F5EB]/95 backdrop-blur-md border-t-2 border-[#B9E3C6] z-50 safe-area-bottom shadow-[0_-4px_25px_rgba(11,107,58,0.08)]">
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
                  ? "text-[#5A3800] font-black"
                  : "text-[#1C3D26] hover:text-[#0B6B3A] font-bold"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all shadow-2xs",
                isActive 
                  ? "bg-[#FACC15] text-[#5A3800] ring-2 ring-amber-400/60 scale-105" 
                  : "bg-[#FEF9C3]/80 text-[#854D0E] hover:bg-[#FEF08A]"
              )}>
                <Icon className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="text-[10px] mt-0.5 truncate font-sans">
                {language === 'bn' ? item.labelBn : item.labelEn}
              </span>
            </NavLink>
          );
        })}

        {/* Logout action */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[#1C3D26] hover:text-rose-700 transition-all font-bold cursor-pointer"
        >
          <div className="p-1.5 rounded-xl bg-amber-50 text-[#854D0E] hover:bg-rose-100 hover:text-rose-700 transition-all shadow-2xs">
            <LogOut className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 truncate font-sans">
            {language === 'bn' ? 'লগআউট' : 'Logout'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MemberMobileNav;
