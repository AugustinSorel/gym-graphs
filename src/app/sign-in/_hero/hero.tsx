import { HeroBackground } from "@/components/ui/heroBackground";
import { Icon } from "@/components/ui/icon";
import type { ComponentProps } from "react";

export const Hero = () => {
  return (
    <Container>
      <Icon size="lg" />
      <Title>gym graphs</Title>

      <BackgroundContainer>
        <HeroBackground />
      </BackgroundContainer>
    </Container>
  );
};

export default Hero;

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="relative hidden flex-1 items-center justify-center gap-5 overflow-x-clip lg:flex"
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 {...props} className="text-4xl font-bold capitalize" />;
};

const BackgroundContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="absolute -top-[var(--header-height)] bottom-0 left-0 right-0 -z-10"
    />
  );
};
