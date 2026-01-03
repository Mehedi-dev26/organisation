import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import AboutPreview from '@/components/home/AboutPreview';
import CommitteePreview from '@/components/home/CommitteePreview';
import NewsPreview from '@/components/home/NewsPreview';
import CTASection from '@/components/home/CTASection';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <HeroSection />
        <StatsSection />
        <AboutPreview />
        <CommitteePreview />
        <NewsPreview />
        <CTASection />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Index;
