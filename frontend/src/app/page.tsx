'use client';

import { FeaturedMenu } from "@/components/landing/FeaturedMenu";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { StorySection } from "@/components/landing/StorySection";

export default function LandingPage() {
  return (
    <div className="font-main">
      <HeroSection />
      <FeaturedMenu />
      <StorySection />
      <Footer />
    </div>
  );
}
