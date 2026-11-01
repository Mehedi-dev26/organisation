import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberProvider, useMember } from './MemberContext';
import MemberSidebar from './MemberSidebar';
import MemberHeader from './MemberHeader';
import MemberMobileNav from './MemberMobileNav';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const MemberLayoutContent = () => {
  const { user, loading } = useAuth();
  const { memberData, memberLoading, refetchMember } = useMember();
  const { language } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="text-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-[#0B6B3A] mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">
            {language === 'bn' ? 'সদস্য পোর্টাল লোড হচ্ছে...' : 'Loading member portal...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (memberLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="text-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-[#0B6B3A] mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">
            {language === 'bn' ? 'সদস্য তথ্য লোড হচ্ছে...' : 'Loading member profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9] p-4">
        <Card className="max-w-md w-full rounded-[24px] border-slate-100 shadow-xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800">
                {language === 'bn' ? 'সদস্য তথ্য প্রক্রিয়াধীন' : 'Member Profile Not Found'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'bn' 
                  ? 'আপনার সদস্য আবেদনটি এখনও অনুমোদন অপেক্ষায় রয়েছে অথবা ডাটা লোড হতে সমস্যা হয়েছে।' 
                  : 'Your membership is pending approval or could not be loaded.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
              <Button
                onClick={() => refetchMember()}
                className="rounded-xl bg-[#0B6B3A] hover:bg-[#08522c] text-white font-bold gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-[#F8FAF9]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <MemberSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <MemberHeader />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto pb-24 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MemberMobileNav />
    </div>
  );
};

const MemberLayout = () => {
  return (
    <MemberProvider>
      <MemberLayoutContent />
    </MemberProvider>
  );
};

export default MemberLayout;
