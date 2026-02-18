import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ShowcaseSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
