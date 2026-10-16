import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Calendar, 
  UserCog, 
  LogOut,
  Home,
  Settings,
  Wallet,
  Receipt,
  History,
  CheckSquare,
  Droplet,
  Building2,
  FileSpreadsheet,
  UserCheck,
  User,
  Sprout
} from 'lucide-react';
import logoRound from '@/assets/logo-round.png';
import topLeaves from '@/assets/activities/top-leaves.png';

const AdminSidebar = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  // Menu items exactly aligned with reference image
  const menuItems = [
    { 
      title: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', 
      url: '/admin', 
      icon: LayoutDashboard,
      exact: true 
    },
    { 
      title: language === 'bn' ? 'সদস্য ব্যবস্থাপনা' : 'Members Management', 
      url: '/admin/members', 
      icon: Users 
    },
    { 
      title: language === 'bn' ? 'রক্তদান ব্যবস্থাপনা' : 'Blood Donors', 
      url: '/admin/blood-donors', 
      icon: Droplet 
    },
    { 
      title: language === 'bn' ? 'সংগঠন ব্যবস্থাপনা' : 'Organization Management', 
      url: '/admin/committee', 
      icon: Building2 
    },
    { 
      title: language === 'bn' ? 'ইভেন্ট ব্যবস্থাপনা' : 'Events Management', 
      url: '/admin/events', 
      icon: Calendar 
    },
    { 
      title: language === 'bn' ? 'কমিটি ব্যবস্থাপনা' : 'Committee Management', 
      url: '/admin/committee', 
      icon: UserCog 
    },
    { 
      title: language === 'bn' ? 'রিপোর্ট' : 'Reports & Gallery', 
      url: '/admin/gallery', 
      icon: FileSpreadsheet 
    },
    { 
      title: language === 'bn' ? 'আর্থিক ব্যবস্থাপনা' : 'Financial Management', 
      url: '/admin/finance', 
      icon: Wallet 
    },
    { 
      title: language === 'bn' ? 'মাসিক চাঁদা' : 'Monthly Dues', 
      url: '/admin/dues', 
      icon: Receipt 
    },
    { 
      title: language === 'bn' ? 'পেমেন্ট ভেরিফাই' : 'Payment Verification', 
      url: '/admin/payment-verification', 
      icon: CheckSquare 
    },
    { 
      title: language === 'bn' ? 'বিভিন্ন হিসাব নিকাশ' : 'Yearly Accounts', 
      url: '/admin/yearly-accounts', 
      icon: History 
    },
    { 
      title: language === 'bn' ? 'ক্যাশিয়ার' : 'Cashiers Management', 
      url: '/admin/cashiers', 
      icon: UserCheck 
    },
    { 
      title: language === 'bn' ? 'সেটিংস' : 'Settings', 
      url: '/admin/settings', 
      icon: Settings 
    },
    // Homepage placed inside the scrolling list right below Settings as requested!
    { 
      title: language === 'bn' ? 'হোমপেজ' : 'Homepage', 
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
    <Sidebar className="!w-[270px] border-r border-emerald-950/20 bg-[#0B3D22] text-white">
      <div className="flex h-full w-full flex-col bg-[#0B3D22] text-white select-none">
        {/* Top Header: Organization Logo & Admin Badge */}
        <div className="p-4 sm:p-5 border-b border-emerald-900/40 flex items-center gap-3.5 bg-[#09351D]/60">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-1">
              <img src={logoRound} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-heading font-extrabold text-lg text-white leading-tight tracking-wide flex items-center gap-1.5">
                {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
              </h2>
              <p className="text-xs text-emerald-300/80 font-medium">
                {language === 'bn' ? 'এডমিন প্যানেল' : 'Management Panel'}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area (Custom Sleek Scrollbar - No white track!) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-5 [scrollbar-width:thin] [scrollbar-color:rgba(16,185,129,0.35)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-emerald-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-600/70 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Main Menu Section */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-emerald-300/70">
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
                        ? "bg-[#0B6B3A] text-white font-bold shadow-md shadow-emerald-950/30"
                        : "text-emerald-100/85 hover:text-white hover:bg-white/10 font-medium"
                    )}
                  >
                    <item.icon 
                      className={cn(
                        "w-5 h-5 flex-shrink-0 stroke-[2.2] transition-transform duration-200 group-hover:scale-105",
                        active ? "text-white" : "text-emerald-200/90 group-hover:text-white"
                      )} 
                    />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Others / অন্যান্য Section */}
          <div className="pt-2 border-t border-emerald-900/40">
            {!collapsed && (
              <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-emerald-300/70">
                {language === 'bn' ? 'অন্যান্য' : 'Others'}
              </div>
            )}
            <nav className="space-y-1">
              {/* Profile Link */}
              <NavLink
                to="/member-dashboard"
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[14.5px] group text-emerald-100/85 hover:text-white hover:bg-white/10 font-medium"
                )}
              >
                <User className="w-5 h-5 flex-shrink-0 stroke-[2.2] text-emerald-200/90 group-hover:text-white" />
                {!collapsed && (
                  <span className="truncate">{language === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
                )}
              </NavLink>

              {/* Logout Button in Red */}
              <button
                type="button"
                onClick={signOut}
                className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[14.5px] text-red-400 hover:text-red-300 hover:bg-red-950/40 font-bold group text-left cursor-pointer"
              >
                <LogOut className="w-5 h-5 flex-shrink-0 stroke-[2.2] text-red-400 group-hover:text-red-300" />
                {!collapsed && (
                  <span className="truncate">{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Motivational Motto & Foliage Graphic */}
        {!collapsed && (
          <div className="relative p-4 pt-3 border-t border-emerald-900/40 bg-gradient-to-b from-[#09351D]/40 to-[#072B17]/90 overflow-hidden">
            <div className="relative z-10 text-center space-y-1">
              <p className="text-xs font-semibold text-emerald-200/90 leading-tight">
                {language === 'bn' ? 'সেবা, সহযোগিতা,' : 'Service, Cooperation,'}
              </p>
              <p className="text-xs font-semibold text-emerald-200/90 leading-tight">
                {language === 'bn' ? 'সমৃদ্ধি আমাদের' : 'Prosperity is our'}
              </p>
              <div className="inline-block relative">
                <span className="text-xs font-extrabold text-amber-300 tracking-wider">
                  {language === 'bn' ? 'অঙ্গীকার' : 'Commitment'}
                </span>
                <svg
                  className="w-full h-2 text-amber-400/80 mt-0.5"
                  viewBox="0 0 100 10"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path d="M2 7C25 2 75 2 98 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Bottom Foliage Illustration */}
            <div className="absolute -bottom-2 -left-3 w-24 h-16 pointer-events-none opacity-40 select-none">
              <img src={topLeaves} alt="" className="w-full h-full object-contain filter brightness-125" />
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminSidebar;
