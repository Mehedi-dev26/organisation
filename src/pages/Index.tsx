import MainLayout from '@/components/layout/MainLayout';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import AboutPreview from '@/components/home/AboutPreview';
import CommitteePreview from '@/components/home/CommitteePreview';
import ProgramsPreview from '@/components/home/ProgramsPreview';
import NewsPreview from '@/components/home/NewsPreview';
import CTASection from '@/components/home/CTASection';

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <StatsSection />
      <AboutPreview />
      <CommitteePreview />
      <ProgramsPreview />
      <CTASection />
      <NewsPreview />
    </MainLayout>
  );
};

export default Index;
