import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  BellRing,
  ArrowRight,
  Home,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Megaphone,
  Clock,
  Smartphone
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
import {
  getNotificationPermission,
  requestPushPermission,
  triggerDuesReminderPush,
  PushPermissionStatus
} from '@/services/pushNotificationService';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

interface NoticeRecord {
  id: string;
  title_bn: string;
  title_en: string;
  content_bn: string;
  category: 'urgent' | 'general' | 'meeting' | 'dues' | 'event';
  target_audience: 'all' | 'executive' | 'general_members';
  is_active: boolean;
  created_at: string;
}

const MemberHeader = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { memberData, unpaidMonths, unpaidDues } = useMember();
  const { logoUrl } = useSiteLogo();
  const navigate = useNavigate();
  const location = useLocation();

  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>(getNotificationPermission());

  // Fetch recent active notices for notifications
  const { data: notices = [] } = useQuery<NoticeRecord[]>({
    queryKey: ['organization_notices'],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'organization_notices')
          .maybeSingle();

        if (data?.value && Array.isArray(data.value)) {
          return data.value.filter((n: NoticeRecord) => n.is_active !== false);
        }
        return [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 60000,
  });

  // Automated Push Notification trigger for dues if permission is granted
  useEffect(() => {
    if (unpaidMonths.length > 0 && pushStatus === 'granted') {
      triggerDuesReminderPush(unpaidMonths.length, unpaidDues);
    }
  }, [unpaidMonths.length, unpaidDues, pushStatus]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleEnablePushFromHeader = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const granted = await requestPushPermission();
    setPushStatus(getNotificationPermission());
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
    if (path.includes('notices')) {
      return {
        title: language === 'bn' ? 'নোটিশ ও ঘোষণা' : 'Notices & Announcements',
        icon: Bell,
      };
    }
    if (path.includes('messages') || path.includes('message-overview')) {
      return {
        title: language === 'bn' ? 'বার্তা বিবরণী (এসএমএস)' : 'Message Overview',
        icon: MessageSquare,
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

  const recentNotices = notices.slice(0, 3);
  const totalNotificationsCount = (unpaidMonths.length > 0 ? 1 : 0) + Math.min(recentNotices.length, 3);

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

        {/* Desktop Page Title */}
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

      {/* Right: Notification Bell + Quick Due Badge (Mobile) + User Profile Menu */}
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

        {/* Notification Bell Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100/80 hover:bg-emerald-50 text-slate-700 hover:text-[#0B6B3A] flex items-center justify-center transition-colors shadow-2xs border border-slate-200/80 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black shadow-xs ring-2 ring-white animate-pulse">
                  {totalNotificationsCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#0B6B3A] to-[#074724] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#9BD038]" />
                <span className="font-heading font-bold text-xs sm:text-sm">
                  {language === 'bn' ? 'নোটিফিকেশন সেন্টার' : 'Notification Center'}
                </span>
              </div>
              {pushStatus !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleEnablePushFromHeader}
                  className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer"
                >
                  {language === 'bn' ? '🔔 পুশ চালু করুন' : 'Enable Push'}
                </button>
              ) : (
                <span className="text-[10px] text-emerald-200 font-medium">
                  {language === 'bn' ? 'পুশ সক্রিয়' : 'Push Active'}
                </span>
              )}
            </div>

            <div className="p-2 space-y-2 max-h-[360px] overflow-y-auto">
              {/* 1. Dues Notification Card */}
              {unpaidMonths.length > 0 && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50/50 border border-rose-200 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="relative flex h-2.5 w-2.5 mt-1 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-rose-900">
                        {language === 'bn'
                          ? `চাঁদা বকেয়া সতর্কতা: ${unpaidMonths.length} মাসের চাঁদা বাকি`
                          : `Dues Alert: ${unpaidMonths.length} unpaid month(s)`}
                      </p>
                      <p className="text-[11px] text-rose-700">
                        {language === 'bn'
                          ? `আপনার মোট বকেয়া ৳${unpaidDues}। অনুগ্রহ করে অনলাইনে এখনই পরিশোধ করুন।`
                          : `Total due ৳${unpaidDues}. Pay online with 1-click.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Link
                      to="/member/pay-dues"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-xs"
                    >
                      <span>{language === 'bn' ? 'পরিশোধ করুন' : 'Pay Now'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* 2. Latest Notices List */}
              {recentNotices.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-muted-foreground px-1 pt-1">
                    {language === 'bn' ? 'সাম্প্রতিক নোটিশ ও ঘোষণা:' : 'Recent Notices:'}
                  </p>
                  {recentNotices.map((n) => (
                    <Link
                      key={n.id}
                      to="/member/notices"
                      className="block p-2.5 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          n.category === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : n.category === 'dues'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {n.category === 'urgent'
                            ? (language === 'bn' ? 'জরুরি' : 'Urgent')
                            : n.category === 'dues'
                            ? (language === 'bn' ? 'চাঁদা' : 'Dues')
                            : (language === 'bn' ? 'নোটিশ' : 'Notice')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(n.created_at), 'dd MMM', {
                            locale: language === 'bn' ? bn : enUS,
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-foreground line-clamp-1">
                        {language === 'bn' ? n.title_bn : (n.title_en || n.title_bn)}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {n.content_bn}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                unpaidMonths.length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    <span>{language === 'bn' ? 'কোনো নতুন নোটিফিকেশন নেই' : 'No new notifications'}</span>
                  </div>
                )
              )}

              {/* 3. SMS History Link Item */}
              <Link
                to="/member/messages"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#E6F4EA]/60 hover:bg-[#E6F4EA] border border-emerald-200/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#0B6B3A]" />
                  <span className="text-xs font-bold text-[#0B6B3A]">
                    {language === 'bn' ? 'বার্তা বিবরণী (মোবাইল এসএমএস)' : 'SMS Message Overview'}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#0B6B3A]" />
              </Link>
            </div>

            {/* Footer */}
            <DropdownMenuSeparator className="my-0" />
            <div className="p-2 bg-muted/20 flex items-center justify-between text-xs">
              <Link
                to="/member/notices"
                className="text-[#0B6B3A] hover:underline font-bold text-[11px] flex items-center gap-1"
              >
                <span>{language === 'bn' ? 'সকল নোটিশ দেখুন' : 'View All Notices'}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                to="/member/messages"
                className="text-muted-foreground hover:text-foreground font-semibold text-[11px]"
              >
                {language === 'bn' ? 'বার্তা হিস্ট্রি' : 'SMS History'}
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Dropdown Button */}
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
                <Link to="/member/notices" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'নোটিশ ও ঘোষণা' : 'Notices & Alerts'}</span>
                  {notices.length > 0 && (
                    <span className="ml-auto text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                      {notices.length}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/member/messages" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'বার্তা বিবরণী (এসএমএস)' : 'Message Overview'}</span>
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
