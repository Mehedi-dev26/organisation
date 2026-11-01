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
  ArrowUpRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSiteLogo } from '@/hooks/useSiteLogo';

const MemberSidebar = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { memberData } = useMember();
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
      badge: null,
    },
    {
      title: language === 'bn' ? 'প্রোফাইল ও আইডি কার্ড' : 'Profile & ID Card',
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
      title: language === 'bn' ? 'চাঁদা পরিশোধ করুন' : 'Pay Dues Online',
      url: '/member/pay-dues',
      exact: false,
      icon: Receipt,
      badge: language === 'bn' ? 'পেমেন্ট' : 'Pay',
    },
  ];

  const isActive = (itemUrl: string, exact: boolean) => {
    if (exact) {
      return location.pathname === itemUrl || location.pathname === '/member-dashboard';
    }
    return location.pathname.startsWith(itemUrl);
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40 select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* 1. Brand Logo & Title */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <Link to="/" className="w-10 h-10 rounded-xl bg-white border border-emerald-600/30 p-1 flex items-center justify-center shrink-0 shadow-xs hover:scale-105 transition-transform overflow-hidden">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-heading font-black text-sm text-[#14231B] leading-tight truncate">
              {language === 'bn' ? 'সময়ের বাতিঘর ফাউন্ডেশন' : 'Somoyer Batighor Foundation'}
            </h1>
            <p className="text-[11px] font-bold text-[#0B6B3A] mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B3A] animate-pulse" />
              <span>{language === 'bn' ? 'সদস্য সেবা পোর্টাল' : 'Member Portal'}</span>
            </p>
          </div>
        </div>

        {/* 2. User Info Card with HD Non-distorted Square Avatar */}
        {memberData && (
          <div className="m-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#E6F4EA]/60 to-[#F2F9F4] border border-[#C8E6C9]/60">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 aspect-square ring-2 ring-[#0B6B3A]/20 shadow-xs bg-white flex items-center justify-center">
                {memberData.photo_url ? (
                  <img
                    src={memberData.photo_url}
                    alt={memberData.full_name}
                    className="w-full h-full object-cover aspect-square"
                  />
                ) : (
                  <span className="text-[#0B6B3A] font-black text-base">
                    {memberData.full_name?.charAt(0) || 'M'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-xs truncate">
                  {memberData.full_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold bg-white text-[#0B6B3A] border-[#C8E6C9]">
                    {memberData.member_id}
                  </Badge>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {language === 'bn' ? 'অনুমোদিত' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Navigation Links */}
        <nav className="p-3 space-y-1">
          <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'bn' ? 'মেনু ও সেবা' : 'Menu & Services'}
          </p>

          {navItems.map((item) => {
            const active = isActive(item.url, item.exact);
            const Icon = item.icon;

            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#0B6B3A] text-white shadow-sm shadow-[#0B6B3A]/20 scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    active ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* 4. Footer Actions */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link
          to="/"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Home className="w-4 h-4 text-slate-400" />
            <span>{language === 'bn' ? 'মূল ওয়েবসাইট' : 'Main Website'}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
};

export default MemberSidebar;

