import React, { ReactNode, Suspense, lazy } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

// Lazy-load the 3D music player to ensure ultra-fast initial page load
const FloatingMusicPlayer = lazy(() => import('@/components/music/FloatingMusicPlayer'));

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <Suspense fallback={null}>
        <FloatingMusicPlayer />
      </Suspense>
    </div>
  );
};

export default MainLayout;
