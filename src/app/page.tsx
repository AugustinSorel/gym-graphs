import { Button } from "@/components/ui/button";
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
          <GradientBackground />
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

const GradientBackground = () => {
  return (
    <svg
      viewBox="0 0 1920 1080"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full min-w-[1000px] opacity-50"
      preserveAspectRatio="none"
    >
      <g className="contrast-150">
        <rect width="100%" height="100%" fill="url(#paint0_linear_9_46)" />
        <g filter="url(#filter0_f_9_46)">
          <path
            d="M1028.61 1087.75C811.445 356.138 44.283 293.866 -312.153 354.182C-847.442 407.977 -882.959 -105.523 -458.026 -169.099C-33.0929 -232.675 314.464 -161.763 956.303 406.754C1598.14 975.272 1865 966 1934.28 999.724C2324.96 1189.89 1300.05 2002.27 1028.61 1087.75Z"
            fill="url(#paint1_linear_9_46)"
          />
        </g>
        <g className="mix-blend-screen" filter="url(#filter1_f_9_46)">
          <path
            d="M1125.01 1405.63C907.848 674.019 140.686 611.747 -215.75 672.063C-751.039 725.858 -786.556 212.358 -361.623 148.782C63.31 85.2055 410.867 156.117 1052.71 724.635C1694.54 1293.15 1803.63 947.152 2030.69 1317.61C2257.74 1688.06 1396.46 2320.15 1125.01 1405.63Z"
            fill="url(#paint2_linear_9_46)"
          />
        </g>
        <g
          className="mix-blend-color-burn dark:mix-blend-color-dodge"
          filter="url(#filter2_f_9_46)"
        >
          <path
            d="M2586.52 1122.76C2789.82 1175.61 3035.45 1068.57 3135.15 883.684L3430.62 335.752C3530.32 150.866 3446.34 -41.854 3243.04 -94.7009L2289.51 -342.569C2086.21 -395.416 1840.59 -288.378 1740.89 -103.492L1445.41 444.44C1345.72 629.326 1429.7 822.046 1633 874.893L2586.52 1122.76Z"
            fill="url(#paint3_radial_9_46)"
          />
        </g>
        <g
          className="mix-blend-color-burn dark:mix-blend-color-dodge"
          filter="url(#filter3_f_9_46)"
        >
          <path
            d="M280.632 1348.02C483.929 1400.87 729.557 1293.83 829.256 1108.94L1124.73 561.009C1224.43 376.123 1140.44 183.403 937.147 130.556L-16.3819 -117.312C-219.679 -170.159 -465.307 -63.1206 -565.007 121.765L-860.478 669.697C-960.178 854.583 -876.195 1047.3 -672.897 1100.15L280.632 1348.02Z"
            fill="url(#paint4_radial_9_46)"
          />
        </g>
      </g>

      <defs>
        <filter
          id="filter0_f_9_46"
          x="-874.389"
          y="-314.283"
          width="3022.4"
          height="1954.4"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="63"
            result="effect1_foregroundBlur_9_46"
          />
        </filter>
        <filter
          id="filter1_f_9_46"
          x="-777.986"
          y="3.59741"
          width="2972.38"
          height="1999.82"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="63"
            result="effect1_foregroundBlur_9_46"
          />
        </filter>
        <filter
          id="filter2_f_9_46"
          x="1282.79"
          y="-476.712"
          width="2310.45"
          height="1733.62"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="60.323"
            result="effect1_foregroundBlur_9_46"
          />
        </filter>
        <filter
          id="filter3_f_9_46"
          x="-1023.1"
          y="-251.455"
          width="2310.45"
          height="1733.62"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="60.323"
            result="effect1_foregroundBlur_9_46"
          />
        </filter>
        <linearGradient
          id="paint0_linear_9_46"
          x1="1027"
          y1="-3.58037e-05"
          x2="-58.4532"
          y2="1855.81"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6070FF" />
          <stop offset="1" stopColor="#4D1B5F" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_9_46"
          x1="69.7652"
          y1="-55.018"
          x2="1113.9"
          y2="1369.69"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#5E31BD" />
          <stop offset="1" className="[stop-color:hsl(var(--background))]" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_9_46"
          x1="166.168"
          y1="262.863"
          x2="1210.31"
          y2="1687.58"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" className="[stop-color:hsl(var(--background))]" />
          <stop offset="1" className="[stop-color:hsl(var(--background))]" />
        </linearGradient>
        <radialGradient
          id="paint3_radial_9_46"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(2189.46 600.563) rotate(-144.199) scale(735.231 715.392)"
        >
          <stop offset="0" stopColor="#5BDCC6" />
          <stop offset="1" stopColor="#F257A0" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="paint4_radial_9_46"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(-116.431 825.821) rotate(-144.199) scale(735.231 715.392)"
        >
          <stop offset="0" stopColor="#5BDCC6" />
          <stop offset="1" stopColor="#F257A0" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
