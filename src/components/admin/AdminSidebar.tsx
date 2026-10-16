import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
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
import logoRound from '@/assets/logo-round.png';

const AdminSidebar = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const { state } = useSidebar();
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
    <Sidebar className="!w-[270px] border-r border-emerald-950/40 bg-[#08301A] text-white shadow-xl">
      <div className="flex h-full w-full flex-col bg-gradient-to-b from-[#09351D] via-[#08301A] to-[#062414] text-white select-none">
        {/* Top Header: Organization Logo & Admin Badge in Signature Emerald Gradient */}
        <div className="p-4 sm:p-5 border-b border-emerald-800/40 flex items-center gap-3.5 bg-gradient-to-r from-emerald-950/70 via-emerald-900/30 to-transparent">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 p-0.5 shadow-md shadow-emerald-950/40 flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-1">
              <img src={logoRound} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-heading font-extrabold text-lg text-white leading-tight tracking-wide flex items-center gap-1.5">
                {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h2>
              <p className="text-xs text-emerald-300/90 font-medium">
                {language === 'bn' ? 'এডমিন প্যানেল' : 'Management Panel'}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area with Sleek Emerald Scrollbar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(16,185,129,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-emerald-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-600/70 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Main Menu Section */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-emerald-300/80">
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
                      "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[14.5px] group",
                      active
                        ? "bg-[#0B6B3A] text-white font-bold shadow-md shadow-emerald-950/50 border border-emerald-500/40"
                        : "text-white/90 hover:text-white hover:bg-white/10 font-medium"
                    )}
                  >
                    <item.icon 
                      className={cn(
                        "w-5 h-5 flex-shrink-0 stroke-[2.2] transition-transform duration-200 group-hover:scale-105",
                        active ? "text-white" : "text-white/85 group-hover:text-white"
                      )} 
                    />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Organization Motto Badge (No logout button here) */}
        {!collapsed && (
          <div className="p-3.5 border-t border-emerald-900/50 bg-emerald-950/40 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/40 text-[11px] font-semibold text-emerald-200">
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
