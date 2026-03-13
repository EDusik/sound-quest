"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Faq } from "@/components/landing/Faq";
import { Cta } from "@/components/landing/Cta";

export function HomeContent() {
  return (
    <div className="min-h-full bg-background">
      <LandingNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Faq />
      <Cta />
    </div>
  );
}
