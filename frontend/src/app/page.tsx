'use client';

import { FeaturedMenu } from "@/components/landing/FeaturedMenu";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { StorySection } from "@/components/landing/StorySection";
import { Header } from '@/components/layout/Header';
import { OnboardingGuide } from '@/components/landing/OnboardingGuide';

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
