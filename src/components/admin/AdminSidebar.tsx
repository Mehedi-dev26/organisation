import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Droplet,
  Newspaper,
  Calendar, 
  UserCog, 
  ImageIcon,
  Wallet,
  Receipt,
  CheckSquare,
  History,
  UserCog2,
  Settings,
  Home,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import logoRound from '@/assets/logo-round.png';

const AdminSidebar = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  // Original menu items restored with exact original names and icons
  const menuItems = [
    { 
      title: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', 
      url: '/admin', 
      icon: LayoutDashboard,
      exact: true 
    },
    { 
      title: language === 'bn' ? 'সদস্য ব্যবস্থাপনা' : 'Members', 
      url: '/admin/members', 
      icon: Users 
    },
    { 
      title: language === 'bn' ? 'রক্তদাতা ব্যবস্থাপনা' : 'Blood Donors', 
      url: '/admin/blood-donors', 
      icon: Droplet 
    },
    { 
      title: language === 'bn' ? 'সংবাদ ব্যবস্থাপনা' : 'News', 
      url: '/admin/news', 
      icon: Newspaper 
    },
    { 
      title: language === 'bn' ? 'ইভেন্ট ব্যবস্থাপনা' : 'Events', 
      url: '/admin/events', 
      icon: Calendar 
    },
    { 
      title: language === 'bn' ? 'কমিটি ব্যবস্থাপনা' : 'Committee', 
      url: '/admin/committee', 
      icon: UserCog 
    },
    { 
      title: language === 'bn' ? 'গ্যালারি' : 'Gallery', 
      url: '/admin/gallery', 
      icon: ImageIcon 
    },
    { 
      title: language === 'bn' ? 'আর্থিক ব্যবস্থাপনা' : 'Finance', 
      url: '/admin/finance', 
      icon: Wallet 
    },
    { 
      title: language === 'bn' ? 'বকেয়া চাঁদা' : 'Dues', 
      url: '/admin/dues', 
      icon: Receipt 
    },
    { 
      title: language === 'bn' ? 'পেমেন্ট যাচাই' : 'Payment Verification', 
      url: '/admin/payment-verification', 
      icon: CheckSquare 
    },
    { 
      title: language === 'bn' ? 'বিগত বছরের হিসাব' : 'Yearly Accounts', 
      url: '/admin/yearly-accounts', 
      icon: History 
    },
    { 
      title: language === 'bn' ? 'ক্যাশিয়ার' : 'Cashiers', 
      url: '/admin/cashiers', 
      icon: UserCog2 
    },
    { 
      title: language === 'bn' ? 'সেটিংস' : 'Settings', 
      url: '/admin/settings', 
      icon: Settings 
    },
    { 
      title: language === 'bn' ? 'হোম পেজ' : 'Home Page', 
      url: '/', 
      icon: Home,
      exact: true
    },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact || path === '/admin' || path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className="!w-[270px] border-r border-slate-200 bg-white text-slate-800 shadow-xs">
      <div className="flex h-full w-full flex-col bg-white text-slate-800 select-none">
        {/* Top Header: Organization Logo & Admin Badge (Always crisp clean white) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3.5 bg-white">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 p-0.5 shadow-sm flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-1">
              <img src={logoRound} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-heading font-extrabold text-lg text-slate-900 leading-tight tracking-wide flex items-center gap-1.5">
                {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
                <ShieldCheck className="w-4 h-4 text-[#0B6B3A]" />
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'bn' ? 'এডমিন প্যানেল' : 'Management Panel'}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area (Always Clean White with Light Emerald Hover/Selected) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(16,185,129,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300/80 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-600/60 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Main Menu Section */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
                {language === 'bn' ? 'প্রধান মেনু' : 'Main Menu'}
              </div>
            )}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const active = isActive(item.url, item.exact);
                return (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    end={item.exact}
                    className={cn(
                      "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-[14.5px] group",
                      active
                        ? "bg-emerald-50 text-[#0B6B3A] font-bold border border-emerald-200/80 shadow-xs"
                        : "text-slate-700 hover:text-[#0B6B3A] hover:bg-emerald-50/70 font-semibold"
                    )}
                  >
                    <item.icon 
                      className={cn(
                        "w-5 h-5 flex-shrink-0 stroke-[2.2] transition-transform duration-150 group-hover:scale-105",
                        active ? "text-[#0B6B3A]" : "text-slate-500 group-hover:text-[#0B6B3A]"
                      )} 
                    />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Others / অন্যান্য Section - ONLY Logout Action */}
          <div className="pt-2 border-t border-slate-100">
            {!collapsed && (
              <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
                {language === 'bn' ? 'অন্যান্য' : 'Others'}
              </div>
            )}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-[14.5px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold group text-left cursor-pointer border border-transparent hover:border-rose-100"
              >
                <LogOut className="w-5 h-5 flex-shrink-0 stroke-[2.2] text-rose-500 group-hover:text-rose-600" />
                {!collapsed && (
                  <span className="truncate">{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default AdminSidebar;
