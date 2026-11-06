import MainLayout from '@/components/layout/MainLayout';
import HeroSection from '@/components/home/HeroSection';
import ActivitiesOverview from '@/components/home/ActivitiesOverview';
import BloodDonationPreview from '@/components/home/BloodDonationPreview';
import AboutPreview from '@/components/home/AboutPreview';
import CommitteePreview from '@/components/home/CommitteePreview';
import CTASection from '@/components/home/CTASection';
import PwaAppSection from '@/components/home/PwaAppSection';
import NewsPreview from '@/components/home/NewsPreview';

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <ActivitiesOverview />
      <BloodDonationPreview />
      <AboutPreview />
      <CommitteePreview />
      <CTASection />
      <PwaAppSection />
      <NewsPreview />
    </MainLayout>
  );
};

export default Index;
