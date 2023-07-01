import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/ui/heroBackground";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Featues } from "./features";

const HomePage = () => {
  return (
    <main className="scrollbar-none relative flex flex-col gap-16 overflow-x-clip sm:gap-56">
      <section className="relative">
        <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] max-w-md flex-col items-center justify-center gap-14 p-5 text-center sm:max-w-3xl">
          <HeroTitle>
            Monitor your gym progress <GradientText>with ease</GradientText>
          </HeroTitle>

          <Text>
            Gym-tracker is a simple modular and free monitoring application with
            features like <StrongText>graphs</StrongText>,{" "}
            <StrongText>heat maps</StrongText> and{" "}
            <StrongText>dashboard</StrongText>, for you for free.
          </Text>

          <GetStartedAction />
        </div>

        <div className="absolute -top-[var(--header-height)] bottom-0 left-0 right-0 -z-10">
          <HeroBackground />
        </div>
      </section>

      <hr className="absolute left-1/2 top-[calc(100vh-4vmax-var(--header-height))] h-[8vmax] w-[125%] -translate-x-1/2 rounded-[50%] bg-background blur-md" />

      <section className="grid grid-cols-1 content-center items-center justify-items-center gap-10 p-5 text-center xl:grid-cols-2">
        <HeroTitle>
          Let&apos;s get your gym progress to{" "}
          <GradientText> the moon </GradientText>
        </HeroTitle>

        <Text>
          Thanks to our <StrongText>dashboard</StrongText>, you are in control
          of what exercises go to your routine. Our powerful{" "}
          <StrongText>graphs</StrongText> will also help you monitoring your
          progress
        </Text>

        <div className="relative xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <Image
            src="/dashboard.png"
            priority
            alt="dashboard of gym graphs"
            width={700}
            height={2000}
            className="drop-shadow-[0_0_70px_hsl(var(--brand-color-one))] dark:drop-shadow-[0_0_70px_hsl(var(--brand-color-one)/0.3)]"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 content-center items-center justify-items-center gap-10 p-5 text-center xl:grid-cols-2">
        <HeroTitle>
          Our system will adapt <GradientText>to you</GradientText>
        </HeroTitle>

        <Text>
          Our system will adapt to your accordingly to your need. Giving you{" "}
          <StrongText>the best</StrongText> user experience possible.
        </Text>

        <div className="relative xl:col-start-1 xl:row-span-2 xl:row-start-1">
          <Image
            src="/exercisePage.png"
            priority
            alt="dashboard of gym graphs"
            width={700}
            height={2000}
            className="drop-shadow-[0_0_70px_hsl(var(--brand-color-two))] dark:drop-shadow-[0_0_70px_hsl(var(--brand-color-two)/0.3)]"
          />
        </div>
      </section>

      <Featues />
    </main>
  );
};

export default HomePage;

const Text = ({ children }: PropsWithChildren) => {
  return <p className="max-w-xl sm:text-2xl">{children}</p>;
};

const HeroTitle = ({ children }: PropsWithChildren) => {
  return (
    <h1 className="max-w-3xl text-4xl font-bold sm:text-7xl">{children}</h1>
  );
};

const GradientText = ({ children }: PropsWithChildren) => {
  return (
    <strong className="bg-brand-gradient bg-clip-text font-bold text-transparent">
      {children}
    </strong>
  );
};

const StrongText = ({ children }: PropsWithChildren) => {
  return <strong className="font-normal text-accent">{children}</strong>;
};

const GetStartedAction = () => {
  return (
    <Button asChild size="lg">
      <Link href="/dashboard">
        <span className="sm:text-xl">get started</span>
        <ArrowRight className="ml-2" />
      </Link>
    </Button>
  );
};
