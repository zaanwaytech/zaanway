"use client";

import React from "react";
import Navbar from "../common/Navbar";
import HeroSection from "./HeroSection";
import LogoTicker from "./LogoTicker";
import FeaturesSection from "./FeaturesSection";
import HowItWorksSection from "./HowItWorksSection";
import PricingSection from "./PricingSection";
import TestimonialsSection from "./TestimonialsSection";
import CTASection from "./CTASection";
import Footer from "../common/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <LogoTicker />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
