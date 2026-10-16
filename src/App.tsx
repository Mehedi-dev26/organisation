import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Members from "./pages/Members";
import Committee from "./pages/Committee";
import Programs from "./pages/Programs";
import News from "./pages/News";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import MemberRegistration from "./pages/MemberRegistration";
import MemberDashboard from "./pages/MemberDashboard";
import PayDues from "./pages/member/PayDues";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import MembersManagement from "./pages/admin/MembersManagement";
import NewsManagement from "./pages/admin/NewsManagement";
import EventsManagement from "./pages/admin/EventsManagement";
import CommitteeManagement from "./pages/admin/CommitteeManagement";
import AdminSettings from "./pages/admin/Settings";
import FinanceManagement from "./pages/admin/FinanceManagement";
import DuesManagement from "./pages/admin/DuesManagement";
import GalleryManagement from "./pages/admin/GalleryManagement";
import YearlyAccounts from "./pages/admin/YearlyAccounts";
import CashierManagement from "./pages/admin/CashierManagement";
import PaymentVerification from "./pages/admin/PaymentVerification";
import BloodDonors from "./pages/BloodDonors";
import BloodDonorsManagement from "./pages/admin/BloodDonorsManagement";
import CashierLayout from "./components/cashier/CashierLayout";
import CashierDashboard from "./pages/cashier/CashierDashboard";
import CashierFinance from "./pages/cashier/CashierFinance";
import CashierDues from "./pages/cashier/CashierDues";
import React, { useEffect } from "react";
import CashierYearlyAccounts from "./pages/cashier/CashierYearlyAccounts";
import CashierPaymentVerification from "./pages/cashier/CashierPaymentVerification";
import { initAutoKeepAlive } from "./services/keepAliveService";

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
          <BrowserRouter>
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
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
  );
};

export default App;
