import { FeaturesSection } from "@/components/feature-section";
import { HeroSection } from "@/components/hero-section";

export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
    </>
  );
}
