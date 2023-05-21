import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/ui/heroBackground";
import { ArrowRight, Brush, Github, LineChart, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cloneElement } from "react";
import type { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

export default function Home() {
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

      <section className="flex flex-col items-center justify-center gap-10 overflow-hidden p-5 pb-12 text-center">
        <h1 className=" text-4xl sm:text-5xl">What we offer</h1>

        <ul className="grid w-full max-w-3xl grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          <Card>
            <CardIcon>
              <LineChart className="bg-pink-500/20 stroke-pink-500" />
            </CardIcon>
            <CardTitle>graphs</CardTitle>
            <CardText>
              Keep track of your progress every session and watch your results
              soar! Get ready to see amazing results!
            </CardText>
          </Card>
          <Card>
            <CardIcon>
              <Wallet className="bg-blue-500/20 stroke-blue-500" />
            </CardIcon>
            <CardTitle>100% free</CardTitle>
            <CardText>
              Great news! Our project is completely free to use, with no hidden
              fees or charges. We value your privacy and do not collect any
              personal information.
            </CardText>
          </Card>
          <Card>
            <CardIcon>
              <Github className="bg-green-500/20 stroke-green-500" />
            </CardIcon>
            <CardTitle>open source</CardTitle>
            <CardText>
              Curious about how this was built? You can check out the code on
              our Github page! We welcome feedback and contributions from our
              community,
            </CardText>
          </Card>
          <Card>
            <CardIcon>
              <Brush className="bg-yellow-500/20 stroke-yellow-500" />
            </CardIcon>
            <CardTitle>customizable</CardTitle>
            <CardText>
              With our modular dashboards, you&apos;re in charge of your
              exercises! Customize your workout experience to fit your
              preferences and needs.
            </CardText>
          </Card>
        </ul>

        <GetStartedAction />
      </section>
    </main>
  );
}

const CardIcon = ({ children }: { children: JSX.Element }) => {
  const className = (children.props as { className: string }).className;

  return cloneElement(children, {
    className: twMerge(
      "h-16 w-16 rounded-md stroke-1 p-2 opacity-50",
      className
    ),
  });
};

const CardText = ({ children }: PropsWithChildren) => {
  return <p className="text-neutral-500">{children}</p>;
};

const CardTitle = ({ children }: PropsWithChildren) => {
  return <h2 className="text-2xl font-semibold capitalize">{children}</h2>;
};

const Card = ({ children }: PropsWithChildren) => {
  return (
    <li className="flex flex-col items-center gap-2.5 rounded-md border border-border p-10 shadow-md">
      {children}
    </li>
  );
};

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
      <Link href="/sign-in">
        <span className="sm:text-xl">get started</span>
        <ArrowRight className="ml-2" />
      </Link>
    </Button>
  );
};
