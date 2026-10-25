import React, { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { initAutoKeepAlive } from "./services/keepAliveService";

// Fast-path eager import for immediate public Homepage render
import Index from "./pages/Index";

// Lazy-loaded public pages for fast initial bundle
const About = lazy(() => import("./pages/About"));
const Members = lazy(() => import("./pages/Members"));
const Committee = lazy(() => import("./pages/Committee"));
const Programs = lazy(() => import("./pages/Programs"));
const News = lazy(() => import("./pages/News"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Contact = lazy(() => import("./pages/Contact"));
const BloodDonors = lazy(() => import("./pages/BloodDonors"));
const MemberRegistration = lazy(() => import("./pages/MemberRegistration"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy-loaded Member portal
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const PayDues = lazy(() => import("./pages/member/PayDues"));

// Lazy-loaded Admin portal
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const MembersManagement = lazy(() => import("./pages/admin/MembersManagement"));
const NewsManagement = lazy(() => import("./pages/admin/NewsManagement"));
const EventsManagement = lazy(() => import("./pages/admin/EventsManagement"));
const CommitteeManagement = lazy(() => import("./pages/admin/CommitteeManagement"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const FinanceManagement = lazy(() => import("./pages/admin/FinanceManagement"));
const DuesManagement = lazy(() => import("./pages/admin/DuesManagement"));
const GalleryManagement = lazy(() => import("./pages/admin/GalleryManagement"));
const YearlyAccounts = lazy(() => import("./pages/admin/YearlyAccounts"));
const CashierManagement = lazy(() => import("./pages/admin/CashierManagement"));
const PaymentVerification = lazy(() => import("./pages/admin/PaymentVerification"));
const BloodDonorsManagement = lazy(() => import("./pages/admin/BloodDonorsManagement"));

// Lazy-loaded Cashier portal
const CashierLayout = lazy(() => import("./components/cashier/CashierLayout"));
const CashierDashboard = lazy(() => import("./pages/cashier/CashierDashboard"));
const CashierFinance = lazy(() => import("./pages/cashier/CashierFinance"));
const CashierDues = lazy(() => import("./pages/cashier/CashierDues"));
const CashierYearlyAccounts = lazy(() => import("./pages/cashier/CashierYearlyAccounts"));
const CashierPaymentVerification = lazy(() => import("./pages/cashier/CashierPaymentVerification"));

// Signature Branded Loading Screen for smooth route transitions
const PageLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-background">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-3 border-emerald-200 border-t-[#0B6B3A] animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-[#0B6B3A]" />
      </div>
    </div>
    <p className="mt-4 text-xs font-semibold text-[#0B6B3A] tracking-wider animate-pulse">
      সময়ের বাতিঘর • লোড হচ্ছে...
    </p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes fresh cache
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
      refetchOnWindowFocus: false, // Prevent continuous refetching on window focus
      refetchOnReconnect: true, // Auto-reconnect when network restores
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
    },
  },
});

const App = () => {
  useEffect(() => {
    initAutoKeepAlive();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <BrowserRouter>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/committee" element={<Committee />} />
                  <Route path="/programs" element={<Programs />} />
                  <Route path="/events" element={<Programs />} />
                  <Route path="/activities" element={<Programs />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/blood-donors" element={<BloodDonors />} />
                  <Route path="/blood" element={<BloodDonors />} />
                  <Route path="/member-registration" element={<MemberRegistration />} />
                  <Route path="/member-dashboard" element={<MemberDashboard />} />
                  <Route path="/member-dashboard/pay-dues" element={<PayDues />} />
                  <Route path="/member/pay-dues" element={<PayDues />} />
                  <Route path="/pay-dues" element={<PayDues />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Auth />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="members" element={<MembersManagement />} />
                    <Route path="blood-donors" element={<BloodDonorsManagement />} />
                    <Route path="news" element={<NewsManagement />} />
                    <Route path="events" element={<EventsManagement />} />
                    <Route path="committee" element={<CommitteeManagement />} />
                    <Route path="gallery" element={<GalleryManagement />} />
                    <Route path="finance" element={<FinanceManagement />} />
                    <Route path="dues" element={<DuesManagement />} />
                    <Route path="payment-verification" element={<PaymentVerification />} />
                    <Route path="yearly-accounts" element={<YearlyAccounts />} />
                    <Route path="cashiers" element={<CashierManagement />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                  <Route path="/cashier" element={<CashierLayout />}>
                    <Route index element={<CashierDashboard />} />
                    <Route path="finance" element={<CashierFinance />} />
                    <Route path="dues" element={<CashierDues />} />
                    <Route path="payment-verification" element={<CashierPaymentVerification />} />
                    <Route path="yearly-accounts" element={<CashierYearlyAccounts />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
  );
};

export default App;
