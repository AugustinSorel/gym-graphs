import { HeroBackground } from "@/components/ui/heroBackground";
import { Icon } from "@/components/ui/icon";

const Hero = () => {
  return (
    <div className="relative hidden grow items-center justify-center gap-5 overflow-x-clip lg:flex">
      <Icon size="lg" />
      <h1 className="text-4xl font-bold capitalize">gym graphs</h1>

      <div className="absolute -top-[var(--header-height)] bottom-0 left-0 right-0 -z-10">
        <HeroBackground />
      </div>
    </div>
  );
};

export default Hero
