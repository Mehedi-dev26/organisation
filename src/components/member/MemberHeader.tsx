import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMember } from './MemberContext';
import { LogOut, CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MemberHeader = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { memberData, unpaidMonths } = useMember();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Brand & Desktop Welcome */}
        <div className="flex items-center gap-3">
          {/* Mobile Logo & Title */}
          <div className="flex md:hidden items-center gap-2.5">
            <Link to="/" className="w-9 h-9 rounded-xl bg-[#E6F4EA] flex items-center justify-center shrink-0">
              <img src="/logo-round.png" alt="Logo" className="w-6 h-6 object-contain aspect-square" />
            </Link>
            <div className="min-w-0">
              <h2 className="font-heading font-black text-xs sm:text-sm text-[#14231B] truncate leading-tight">
                {language === 'bn' ? 'সময়ের বাতিঘর ফাউন্ডেশন' : 'Somoyer Batighor Foundation'}
              </h2>
              <p className="text-[10px] font-bold text-[#0B6B3A]">
                {language === 'bn' ? 'সদস্য পোর্টাল' : 'Member Portal'}
              </p>
            </div>
          </div>

          {/* Desktop Subtitle */}
          <div className="hidden md:flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#C8E6C9] text-[#0B6B3A] text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{language === 'bn' ? 'সময়ের বাতিঘর ফাউন্ডেশন' : 'Somoyer Batighor Foundation'}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick actions & Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Pay Dues Quick Pill */}
          {unpaidMonths.length > 0 && (
            <Link
              to="/member/pay-dues"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-all shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? `চাঁদা বাকি (${unpaidMonths.length} মাস)` : `Due (${unpaidMonths.length})`}</span>
            </Link>
          )}

          {/* Round HD Avatar (never squashed or flattened) */}
          {memberData && (
            <Link
              to="/member/profile"
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors"
            >
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
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                  {memberData.full_name}
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  {memberData.member_id}
                </p>
              </div>
            </Link>
          )}

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title={language === 'bn' ? 'লগআউট' : 'Logout'}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MemberHeader;
