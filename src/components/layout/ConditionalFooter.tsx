"use client";

import { usePathname } from "next/navigation";
import { LANDING_PATH } from "@/lib/landing";
import { Footer } from "@/components/layout/Footer";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === LANDING_PATH) {
    return <LandingFooter />;
  }
  return <Footer />;
}
