import MainLayout from '@/components/layout/MainLayout';
import HeroSection from '@/components/home/HeroSection';
import ActivitiesOverview from '@/components/home/ActivitiesOverview';
import AboutPreview from '@/components/home/AboutPreview';
import CommitteePreview from '@/components/home/CommitteePreview';
import NewsPreview from '@/components/home/NewsPreview';
import CTASection from '@/components/home/CTASection';

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <ActivitiesOverview />
      <AboutPreview />
      <CommitteePreview />
      <CTASection />
      <NewsPreview />
    </MainLayout>
  );
};

export default Index;
