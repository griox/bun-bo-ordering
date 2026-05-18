import { FeaturedMenu } from "@/components/landing/FeaturedMenu";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { StorySection } from "@/components/landing/StorySection";
import { Header } from '@/components/layout/Header';
import { OnboardingGuide } from '@/components/landing/OnboardingGuide';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trang chủ | Bún Bò Chung Cư',
  description: 'Khám phá không gian retro và thưởng thức bún bò chuẩn vị.',
  openGraph: {
    title: 'Trang chủ | Bún Bò Chung Cư',
    description: 'Khám phá không gian retro và thưởng thức bún bò chuẩn vị.',
  }
};

export default function LandingPage() {
  return (
    <div className="font-main">
      <OnboardingGuide />
      <Header />
      <HeroSection />
      <FeaturedMenu />
      <StorySection />
      <Footer />
    </div>
  );
}
