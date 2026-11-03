import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMember } from './MemberContext';
import { 
  LogOut, 
  CreditCard, 
  ExternalLink, 
  ShieldCheck, 
  ChevronDown, 
  User as UserIcon, 
  Sparkles,
  LayoutDashboard,
  Key,
  BadgeCheck,
  Bell,
  ArrowRight,
  Home,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const MemberHeader = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { memberData, unpaidMonths, unpaidDues } = useMember();
  const { logoUrl } = useSiteLogo();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  // Dynamic Page Title & Icon based on route
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path === '/member' || path === '/member-dashboard') {
      return {
        title: language === 'bn' ? 'সদস্য ড্যাশবোর্ড' : 'Member Dashboard',
        icon: LayoutDashboard,
      };
    }
    if (path.includes('dues') && !path.includes('pay-dues')) {
      return {
        title: language === 'bn' ? 'চাঁদা ব্যবস্থাপনা' : 'Dues Management',
        icon: CreditCard,
      };
    }
    if (path.includes('pay-dues')) {
      return {
        title: language === 'bn' ? 'অনলাইন চাঁদা পরিশোধ' : 'Pay Dues Online',
        icon: CreditCard,
      };
    }
    if (path.includes('id-card')) {
      return {
        title: language === 'bn' ? 'ফটো আইডি কার্ড জেনারেটর' : 'Photo ID Card Generator',
        icon: Sparkles,
      };
    }
    if (path.includes('profile')) {
      return {
        title: language === 'bn' ? 'সদস্য প্রোফাইল' : 'Member Profile',
        icon: UserIcon,
      };
    }
    if (path.includes('security')) {
      return {
        title: language === 'bn' ? 'নিরাপত্তা ও পাসওয়ার্ড' : 'Security & Password',
        icon: Key,
      };
    }
    return {
      title: language === 'bn' ? 'সদস্য পোর্টাল' : 'Member Portal',
      icon: ShieldCheck,
    };
  };

  const currentHeader = getHeaderInfo();
  const HeaderIcon = currentHeader.icon;

  return (
    <header className="h-16 shrink-0 border-b border-emerald-950/10 flex items-center justify-between px-4 sm:px-6 md:px-8 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs gap-3">
      {/* Left: Mobile Brand & Desktop Dynamic Title */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile Logo & Title */}
        <div className="flex md:hidden items-center gap-2.5">
          <Link 
            to="/" 
            className="w-9 h-9 rounded-xl bg-white border border-emerald-600/30 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden"
          >
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </Link>
          <div className="min-w-0">
            <h2 className="font-heading font-black text-xs sm:text-sm text-[#14231B] truncate leading-tight">
              {language === 'bn' ? 'সময়ের বাতিঘর' : 'Somoyer Batighor'}
            </h2>
            <p className="text-[10px] font-bold text-[#0B6B3A]">
              {language === 'bn' ? 'সদস্য পোর্টাল' : 'Member Portal'}
            </p>
          </div>
        </div>

        {/* Desktop Page Title (Admin-like Styling) */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] text-[#0B6B3A] flex items-center justify-center shrink-0 shadow-2xs">
            <HeaderIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h1 className="font-heading font-extrabold text-base sm:text-lg text-slate-800 tracking-tight whitespace-nowrap">
            {currentHeader.title}
          </h1>
        </div>
      </div>

      {/* Middle: Prominent Unpaid Due Status Alert Pill */}
      <div className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-4">
        {unpaidMonths.length > 0 ? (
          <Link
            to="/member/pay-dues"
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 hover:border-rose-400 text-rose-700 text-xs font-bold transition-all shadow-2xs hover:shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="truncate">
              {language === 'bn'
                ? `আপনার ${unpaidMonths.length} মাসের চাঁদা বাকি (৳${unpaidDues})`
                : `${unpaidMonths.length} unpaid due(s) pending (৳${unpaidDues})`}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-black group-hover:bg-rose-700 transition-colors">
              <span>{language === 'bn' ? 'পরিশোধ করুন' : 'Pay Now'}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-semibold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0B6B3A]" />
            <span>{language === 'bn' ? 'সকল মাসিক চাঁদা পরিশোধিত' : 'All Dues Cleared'}</span>
          </div>
        )}
      </div>

      {/* Right: Quick Due Badge (Mobile/Tablet) + User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Due Badge */}
        {unpaidMonths.length > 0 && (
          <Link
            to="/member/pay-dues"
            className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold hover:bg-rose-100 transition-colors"
          >
            <CreditCard className="w-3 h-3" />
            <span>{language === 'bn' ? `${unpaidMonths.length} বাকি` : `${unpaidMonths.length} Due`}</span>
          </Link>
        )}

        {/* User Profile Dropdown Button (matching Admin Panel UI) */}
        {memberData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 pl-2.5 sm:pl-3 border-l border-slate-200 hover:opacity-95 transition-all cursor-pointer text-left focus:outline-none group rounded-xl py-1 px-1.5 hover:bg-slate-50"
              >
                <div className="relative">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 aspect-square ring-2 ring-[#0B6B3A]/30 bg-slate-100 flex items-center justify-center shadow-xs">
                    {memberData.photo_url ? (
                      <img
                        src={memberData.photo_url}
                        alt={memberData.full_name}
                        className="w-full h-full object-cover aspect-square"
                      />
                    ) : (
                      <span className="text-[#0B6B3A] font-black text-sm">
                        {memberData.full_name?.charAt(0) || 'M'}
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                </div>

                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors truncate max-w-[130px]">
                    {memberData.full_name}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold leading-none mt-0.5 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{memberData.member_id || (language === 'bn' ? 'সক্রিয় সদস্য' : 'Verified Member')}</span>
                  </p>
                </div>

                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 group-data-[state=open]:rotate-180 ml-0.5" />
              </button>
            </DropdownMenuTrigger>

            {/* Dropdown Menu Content */}
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-slate-100">
              {/* Member Summary Header */}
              <DropdownMenuLabel className="p-3 bg-gradient-to-br from-[#E6F4EA] to-emerald-50 rounded-xl mb-1 border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-white ring-1 ring-emerald-500/30 flex items-center justify-center font-bold text-[#0B6B3A] text-sm shrink-0">
                    {memberData.photo_url ? (
                      <img src={memberData.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      memberData.full_name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {memberData.full_name}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-mono">
                      ID: {memberData.member_id}
                    </p>
                    {memberData.blood_group && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                        🩸 রক্তের গ্রুপ: {memberData.blood_group}
                      </p>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1" />

              {/* Navigation Actions */}
              <DropdownMenuItem asChild>
                <Link to="/member" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview'}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/member/dues" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'চাঁদা ব্যবস্থাপনা ও রসিদ' : 'Dues & Receipts'}</span>
                  {unpaidMonths.length > 0 && (
                    <span className="ml-auto text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                      {unpaidMonths.length}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/member/pay-dues" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{language === 'bn' ? 'অনলাইন চাঁদা পরিশোধ' : 'Pay Online'}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/member/id-card" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'ফটো আইডি কার্ড জেনারেটর' : 'Photo ID Card'}</span>
                  <span className="ml-auto text-[10px] bg-amber-400 text-emerald-950 px-1.5 py-0.2 rounded-full font-bold">
                    নতুন
                  </span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/member/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'প্রোফাইল তথ্য সম্পাদনা' : 'Edit Profile'}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/member/security" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'নিরাপত্তা ও পাসওয়ার্ড' : 'Security'}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <Home className="w-4 h-4 text-slate-500" />
                  <span>{language === 'bn' ? 'প্রধান ওয়েবসাইট' : 'Main Website'}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              {/* Logout Option */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default MemberHeader;
