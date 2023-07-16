import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/ui/heroBackground";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

const HomePage = () => {
  return (
    <main className="relative flex flex-col gap-16 overflow-x-clip sm:gap-56">
      <HeroSection />

      <Separator />

      <FeatureOne />

      <FeatureTwo />

      <FeatuesGrid />
    </main>
  );
};

export default HomePage;

const HeroSection = () => {
  return (
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
  );
};

const Separator = () => {
  return (
    <svg className="absolute left-0 top-[calc(100vh-100px-var(--header-height))] h-[200px] w-full">
      <filter
        id="homePageSeparatorBlur"
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
      </filter>

      <ellipse
        cx="50%"
        cy="50%"
        rx="60%"
        ry="40px"
        filter="url(#homePageSeparatorBlur)"
        className="fill-background sm:[ry:80px]"
      />
    </svg>
  );
};

const FeatureOne = () => {
  return (
    <section className="grid grid-cols-1 content-center items-center justify-items-center gap-10 p-5 text-center xl:grid-cols-2">
      <HeroTitle>
        Let&apos;s get your gym progress to{" "}
        <GradientText> the moon </GradientText>
      </HeroTitle>

      <Text>
        Thanks to our <StrongText>dashboard</StrongText>, you are in control of
        what exercises go to your routine. Our powerful{" "}
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
  );
};

const FeatureTwo = () => {
  return (
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
  );
};

const FeatuesGrid = () => {
  return (
    <section className="relative">
      <div className="mx-auto flex max-w-7xl flex-col items-center space-y-20 p-5">
        <HeroTitle>what we offer</HeroTitle>

        <ul className='grid grid-cols-1 gap-5 lg:grid-cols-7 lg:grid-rows-2 lg:[grid-template-areas:"card-one_card-one_card-two_card-two_card-two_card-three_card-three""card-four_card-four_card-four_card-five_card-five_card-three_card-three"]'>
          <Card className="lg:[grid-area:card-one]">
            <CardIcon>📈</CardIcon>
            <CardTitle>insights & analytics</CardTitle>
            <CardText>
              Keep track of your progress every session and watch your results
              soar! Get ready to see amazing results!
            </CardText>
          </Card>
          <Card className="lg:[grid-area:card-two]">
            <CardIcon>💻</CardIcon>
            <CardTitle>cross platform</CardTitle>
            <CardText>
              Seamlessly switch between devices and access your workout data
              anytime, anywhere. Our platform is compatible with desktop,
              mobile, and tablet devices, ensuring you can stay connected and
              motivated on the go.
            </CardText>
          </Card>
          <Card className="lg:[grid-area:card-three]">
            <CardIcon>🤝</CardIcon>
            <CardTitle>open source</CardTitle>
            <CardText>
              If you&apos;re interested in the behind-the-scenes development of
              our platform, we invite you to explore the code on our{" "}
              <Link
                href="https://github.com/augustinsorel/gym-graphs"
                className="underline decoration-wavy"
                target="_blank"
              >
                Github
              </Link>
              ! We highly value feedback and contributions from our community.
              <br />
              <br />
              Your input and ideas play a crucial role in shaping the future of
              our platform, and we appreciate the collaborative spirit that
              drives us forward.
            </CardText>
          </Card>
          <Card className="lg:[grid-area:card-four]">
            <CardIcon>🧩</CardIcon>
            <CardTitle>customizable</CardTitle>
            <CardText>
              With our modular dashboards, you&apos;re in charge of your
              exercises! Customize your workout experience to fit your
              preferences and needs.
            </CardText>
          </Card>
          <Card className="lg:[grid-area:card-five]">
            <CardIcon>🎁</CardIcon>
            <CardTitle>100% free</CardTitle>
            <CardText>
              Great news! Our project is completely free to use, with no hidden
              fees or charges. We value your privacy and do not collect any
              personal information.
            </CardText>
          </Card>
        </ul>

        <GetStartedAction />

        <FeaturesGridBackground />
      </div>
    </section>
  );
};

const Card = (props: HTMLAttributes<HTMLLIElement>) => {
  return (
    <li
      {...props}
      className={twMerge(
        "space-y-3 rounded-md border border-border bg-primary p-7 text-2xl font-semibold backdrop-blur-md transition-colors hover:bg-border",
        props.className
      )}
    />
  );
};

const CardIcon = (props: HTMLAttributes<HTMLSpanElement>) => {
  return <span className="" {...props} />;
};

const CardTitle = (props: HTMLAttributes<HTMLHeadingElement>) => {
  return <h2 {...props} className="capitalize" />;
};

const CardText = (props: HTMLAttributes<HTMLParagraphElement>) => {
  return <p className="text-lg font-normal text-muted-foreground" {...props} />;
};

const Text = (props: HTMLAttributes<HTMLParagraphElement>) => {
  return <p className="max-w-xl sm:text-2xl" {...props} />;
};

const HeroTitle = (props: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h1
      className="max-w-3xl text-4xl font-bold first-letter:capitalize sm:text-7xl"
      {...props}
    />
  );
};

const GradientText = (props: HTMLAttributes<HTMLElement>) => {
  return (
    <strong
      className="bg-brand-gradient bg-clip-text font-bold text-transparent"
      {...props}
    />
  );
};

const StrongText = (props: HTMLAttributes<HTMLElement>) => {
  return <strong className="font-semibold text-brand-color-two" {...props} />;
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

const FeaturesGridBackground = () => {
  return (
    <svg className="absolute bottom-0 left-0 right-0 -z-10 h-full w-full">
      <filter
        id="featuresGridBlur"
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
      </filter>

      <ellipse
        cx="35%"
        cy="40%"
        rx="20%"
        ry="20%"
        filter="url(#featuresGridBlur)"
        className="fill-brand-color-one opacity-20 dark:opacity-10"
      />
      <ellipse
        cx="80%"
        cy="70%"
        rx="30%"
        ry="30%"
        filter="url(#featuresGridBlur)"
        className="fill-brand-color-two opacity-20 dark:opacity-10"
      />
    </svg>
  );
};
