import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ComponentProps } from "react";
import { AppIcon } from "~/features/ui/app-icon";
import { HeroBackground } from "~/features/ui/hero-background";

export const Route = createFileRoute("/_auth")({
  component: () => RouteComponent(),
});

const RouteComponent = () => {
  return (
    <Main>
      <Hero />
      <Content />
    </Main>
  );
};

const Hero = () => {
  return (
    <Section className="relative hidden items-center justify-center gap-5 overflow-hidden lg:flex">
      <AppIcon size="lg" />
      <Title>gym graphs</Title>
      <BackgroundContainer>
        <HeroBackground />
      </BackgroundContainer>
    </Section>
  );
};

const Content = () => {
  return (
    <Section className="m-auto w-full max-w-md p-4">
      <Outlet />
    </Section>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="grid min-h-screen grid-cols-[1fr] lg:grid-cols-[1fr_1fr]"
      {...props}
    />
  );
};

const Section = (props: ComponentProps<"section">) => {
  return <section {...props} />;
};

const Title = (props: ComponentProps<"h2">) => {
  return (
    <h2 {...props} className="text-center text-4xl font-bold capitalize" />
  );
};

const BackgroundContainer = (props: ComponentProps<"div">) => {
  return (
    <div {...props} className="absolute bottom-0 left-0 right-0 top-0 -z-10" />
  );
};
