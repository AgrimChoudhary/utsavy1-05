import React, { useState, useEffect } from "react";
import { useTemplates } from "@/hooks/useEvents";
import Header from "@/components/homepage/Header";
import Hero from "@/components/homepage/Hero";
import Features from "@/components/homepage/Features";
import TemplateShowcase from "@/components/homepage/TemplateShowcase";
import HowItWorks from "@/components/homepage/HowItWorks";
import Testimonials from "@/components/homepage/Testimonials";
import CTASection from "@/components/homepage/CTASection";
import Footer from "@/components/homepage/Footer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const Index = () => {
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Simulate a minimum loading time to ensure smooth transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!templatesLoading) {
        setIsPageLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [templatesLoading]);

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-800">
        <div className="text-center">
          <LoadingSpinner size="lg" className="text-white" />
          <p className="mt-4 text-white/80 animate-pulse">Loading amazing experiences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Hero templates={templates || []} />
      <Features />
      <TemplateShowcase templates={templates || []} />
      <HowItWorks />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;