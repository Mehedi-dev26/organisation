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
import News from "./pages/News";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import MemberRegistration from "./pages/MemberRegistration";
import MemberDashboard from "./pages/MemberDashboard";
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

const queryClient = new QueryClient();

const App = () => (
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
              <Route path="/news" element={<News />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/member-registration" element={<MemberRegistration />} />
              <Route path="/member-dashboard" element={<MemberDashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="members" element={<MembersManagement />} />
                <Route path="news" element={<NewsManagement />} />
                <Route path="events" element={<EventsManagement />} />
                <Route path="committee" element={<CommitteeManagement />} />
                <Route path="gallery" element={<GalleryManagement />} />
                <Route path="finance" element={<FinanceManagement />} />
                <Route path="dues" element={<DuesManagement />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
