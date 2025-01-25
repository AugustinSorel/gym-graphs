import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppIcon } from "~/ui/app-icon";
import { HeroBackground } from "~/ui/hero-background";
import { z } from "zod";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(auth)/_layout")({
  validateSearch: z.object({
    error: z.string().optional(),
  }),
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
    <Section className="relative hidden items-center justify-center gap-5 overflow-x-clip lg:flex">
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
      className="grid min-h-[calc(100dvh-var(--header-height))] grid-cols-[1fr] lg:grid-cols-[1fr_1fr]"
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
    <div
      {...props}
      className="absolute -top-[var(--header-height)] bottom-0 left-0 right-0 -z-10"
    />
  );
};
