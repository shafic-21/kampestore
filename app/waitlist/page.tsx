import HeroSection from "@/features/waitlist/ui/components/hero-section";
import { AuroraBackground } from "@/components/ui/aurora-background";

function Page() {
  return (
    <div>
      <AuroraBackground className="bg-foreground">
        <HeroSection />
      </AuroraBackground>
    </div>
  );
}

export default Page;
