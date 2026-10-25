import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteLogo } from '@/hooks/useSiteLogo';
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
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const AdminSidebar = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const { state } = useSidebar();
  const { logoUrl } = useSiteLogo();
  const collapsed = state === 'collapsed';

  // Navigation menu items
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
    <Sidebar className="!w-[270px] border-r border-emerald-600/30 bg-gradient-to-b from-[#0E6838] via-[#0B562E] to-[#084223] text-white shadow-2xl">
      <div className="flex h-full w-full flex-col bg-gradient-to-b from-[#0F6F3C] via-[#0C5A30] to-[#094726] text-white select-none relative overflow-hidden">
        {/* Subtle decorative glow overlay */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-36 h-36 bg-emerald-300/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header: Dynamic Organization Logo & Admin Badge in Luminous Emerald Gradient */}
        <div className="p-4 sm:p-5 border-b border-emerald-500/25 flex items-center gap-3.5 bg-gradient-to-r from-emerald-800/50 via-emerald-700/25 to-transparent relative z-10 backdrop-blur-xs">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 p-0.5 shadow-md shadow-emerald-950/30 flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-0.5">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-heading font-extrabold text-lg text-white leading-tight tracking-wide flex items-center gap-1.5">
                {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              </h2>
              <p className="text-xs text-emerald-200/90 font-medium">
                {language === 'bn' ? 'এডমিন প্যানেল' : 'Management Panel'}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area with Sleek Emerald Scrollbar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-4 relative z-10 [scrollbar-width:thin] [scrollbar-color:rgba(52,211,153,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-emerald-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-400/60 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Main Menu Section */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-emerald-200/90">
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
                      "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[14px] group",
                      active
                        ? "bg-white/20 text-white font-bold shadow-md shadow-emerald-950/30 border border-white/30 backdrop-blur-md"
                        : "text-emerald-50/90 hover:text-white hover:bg-white/12 font-medium"
                    )}
                  >
                    <item.icon 
                      className={cn(
                        "w-5 h-5 flex-shrink-0 stroke-[2.2] transition-transform duration-200 group-hover:scale-105",
                        active ? "text-amber-300" : "text-emerald-200/90 group-hover:text-white"
                      )} 
                    />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Organization Motto Badge */}
        {!collapsed && (
          <div className="p-3.5 border-t border-emerald-600/25 bg-emerald-900/30 text-center relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-500/30 text-[11px] font-semibold text-emerald-100 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{language === 'bn' ? 'একতাই শক্তি, সেবাই ধর্ম' : 'Unity is Strength'}</span>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminSidebar;
