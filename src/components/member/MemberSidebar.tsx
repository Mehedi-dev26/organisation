import React from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMember } from './MemberContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  User, 
  Key, 
  LogOut, 
  Home, 
  Receipt, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteLogo } from '@/hooks/useSiteLogo';

const MemberSidebar = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { memberData, unpaidMonths, unpaidDues } = useMember();
  const { logoUrl } = useSiteLogo();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    {
      title: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard',
      url: '/member',
      exact: true,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      title: language === 'bn' ? 'চাঁদা ব্যবস্থাপনা' : 'Dues & Fees',
      url: '/member/dues',
      exact: false,
      icon: CreditCard,
      badge: unpaidMonths.length > 0 ? (language === 'bn' ? `${unpaidMonths.length} বাকি` : `${unpaidMonths.length} Due`) : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      title: language === 'bn' ? 'অনলাইন চাঁদা পরিশোধ' : 'Pay Online',
      url: '/member/pay-dues',
      exact: false,
      icon: Receipt,
      badge: language === 'bn' ? 'পেমেন্ট' : 'Pay',
      badgeColor: 'bg-[#9BD038] text-[#14231B]',
    },
    {
      title: language === 'bn' ? 'ফটো আইডি কার্ড' : 'Photo ID Card',
      url: '/member/id-card',
      exact: false,
      icon: Sparkles,
      badge: language === 'bn' ? 'নতুন' : 'New',
      badgeColor: 'bg-amber-300 text-emerald-950',
    },
    {
      title: language === 'bn' ? 'প্রোফাইল তথ্য' : 'Member Profile',
      url: '/member/profile',
      exact: false,
      icon: User,
      badge: null,
    },
    {
      title: language === 'bn' ? 'নিরাপত্তা ও পাসওয়ার্ড' : 'Security & Password',
      url: '/member/security',
      exact: false,
      icon: Key,
      badge: null,
    },
    {
      title: language === 'bn' ? 'মূল ওয়েবসাইট' : 'Main Website',
      url: '/',
      exact: true,
      icon: Home,
      badge: null,
    },
  ];

  const isActive = (itemUrl: string, exact: boolean) => {
    if (exact || itemUrl === '/member' || itemUrl === '/') {
      return location.pathname === itemUrl || (itemUrl === '/member' && location.pathname === '/member-dashboard');
    }
    return location.pathname.startsWith(itemUrl);
  };

  return (
    <aside className="w-[270px] bg-gradient-to-b from-[#0E6838] via-[#0B562E] to-[#084223] text-white border-r border-emerald-600/30 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40 select-none shadow-2xl relative overflow-hidden">
      {/* Decorative background glow orbs (matching AdminSidebar) */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 left-0 w-36 h-36 bg-emerald-300/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header: Organization Logo & Member Portal Title (h-16) */}
      <div className="h-16 px-4 border-b border-emerald-500/25 flex items-center gap-3 bg-gradient-to-r from-emerald-800/40 via-emerald-700/20 to-transparent relative z-10 shrink-0">
        <Link 
          to="/" 
          className="w-10 h-10 rounded-xl bg-white p-1 border border-white/30 shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden hover:scale-105 transition-transform"
          title={language === 'bn' ? 'হোমপেজে যান' : 'Go to Homepage'}
        >
          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading font-bold text-sm text-white leading-tight tracking-wide flex items-center gap-1.5 truncate">
            <span>{language === 'bn' ? 'সময়ের বাতিঘর' : 'Somoyer Batighor'}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          </h2>
          <p className="text-[11px] text-emerald-200/90 font-medium leading-none mt-0.5">
            {language === 'bn' ? 'সদস্য পোর্টাল' : 'Member Portal'}
          </p>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-4 relative z-10 [scrollbar-width:thin] [scrollbar-color:rgba(52,211,153,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-emerald-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-400/60 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Main Menu Label */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-emerald-200/90">
            {language === 'bn' ? 'প্রধান মেনু' : 'Main Menu'}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.url, item.exact);
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.exact}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[14px] group",
                    active
                      ? "bg-white/20 text-white font-bold shadow-md shadow-emerald-950/30 border border-white/30 backdrop-blur-md"
                      : "text-white hover:bg-white/15 font-medium"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon 
                      className={cn(
                        "w-5 h-5 flex-shrink-0 stroke-[2.2] transition-transform duration-200 group-hover:scale-105",
                        active ? "text-amber-300" : "text-white group-hover:scale-110"
                      )} 
                    />
                    <span className="truncate">{item.title}</span>
                  </div>

                  {item.badge && (
                    <span className={cn(
                      "text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs shrink-0",
                      item.badgeColor || "bg-amber-300 text-emerald-950"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Member Profile Quick Card */}
        {memberData && (
          <div className="pt-2">
            <Link
              to="/member/profile"
              className="block p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-emerald-300/40 bg-white/20 flex items-center justify-center">
                    {memberData.photo_url ? (
                      <img
                        src={memberData.photo_url}
                        alt={memberData.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {memberData.full_name?.charAt(0) || 'M'}
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0B562E]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                    {memberData.full_name}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-200 mt-0.5 flex items-center gap-1">
                    <span>ID: {memberData.member_id}</span>
                    {memberData.blood_group && (
                      <span className="text-[9px] bg-rose-500/80 text-white px-1 py-0.2 rounded font-bold">
                        {memberData.blood_group}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Organization Motto & Logout Button */}
      <div className="p-3 border-t border-emerald-600/30 bg-emerald-900/40 relative z-10 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-800/60 border border-emerald-500/30 text-[10px] font-semibold text-emerald-100 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{language === 'bn' ? 'একতাই শক্তি, সেবাই ধর্ম' : 'Unity is Strength'}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-rose-600/60 transition-colors cursor-pointer"
            title={language === 'bn' ? 'লগআউট করুন' : 'Logout'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default MemberSidebar;
