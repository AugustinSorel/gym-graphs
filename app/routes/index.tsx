import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ComponentProps } from "react";
import { ExerciseAdvanceOverviewGraph } from "~/exercise/components/exercise-advanced-overview-graph";
import { ExerciseOverviewGraph } from "~/exercise/components/exercise-overview-graph";
import { ExerciseTable } from "~/exercise/components/exercise-table";
import { homePageExerciseTableColumns } from "~/exercise/components/exercise-table-columns";
import { exercisesMock } from "~/exercise/exercise.mock";
import { cn } from "~/styles/styles.utils";
import { Button } from "~/ui/button";
import { HeroBackground } from "~/ui/hero-background";
import { UserProvider } from "~/user/user.context";
import { userMock } from "~/user/user.mock";

export const Route = createFileRoute("/")({
  component: () => Home(),
  beforeLoad: async ({ context }) => {
    if (context.user && context.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

const Home = () => {
  return (
    <Main>
      <HeroSection />

      <FeatureOne />

      <FeatureTwo />

      <FeatuesGrid />
    </Main>
  );
};

const HeroSection = () => {
  return (
    <HeroContainer>
      <HeroContent>
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
      </HeroContent>

      <HeroBackgroundContainer>
        <HeroBackground />
      </HeroBackgroundContainer>

      <Separator />
    </HeroContainer>
  );
};

const FeatureOne = () => {
  return (
    <FeatureContainer>
      <HeroTitle>
        Unleash <GradientText> Your Progress!</GradientText>
      </HeroTitle>

      <Text>
        With our innovative modular <StrongText>dashboard</StrongText>, you can
        easily track your entire workout journey and get a comprehensive
        breakdown of your achievements each <StrongText>month</StrongText>.
      </Text>

      <Grid>
        {exercisesMock.map((exercise) => (
          <Card key={exercise.id}>
            <Name>{exercise.name}</Name>
            <ExerciseOverviewGraph sets={exercise.sets} />
          </Card>
        ))}
      </Grid>
    </FeatureContainer>
  );
};

const FeatureTwo = () => {
  const sets = exercisesMock[0].sets;

  return (
    <FeatureContainer>
      <HeroTitle>
        Track <GradientText>Every Move!</GradientText>
      </HeroTitle>

      <Text>
        Our app allows you to <StrongText>effortlessly</StrongText> track all
        your custom exercises, so you can stay in control of your fitness
        journey like never before.
      </Text>

      <UserProvider user={userMock}>
        <CardTwo>
          <ExerciseAdvanceOverviewGraph sets={sets} />
        </CardTwo>
        <CardTwo>
          <ExerciseTable sets={sets} columns={homePageExerciseTableColumns} />
        </CardTwo>
      </UserProvider>
    </FeatureContainer>
  );
};

const FeatuesGrid = () => {
  return (
    <FeatureContainer>
      <HeroTitle>
        what <GradientText>we offer</GradientText>
      </HeroTitle>

      <BentoGrid>
        <BentoItem className="lg:[grid-area:card-one]">
          <BentoIcon>📈</BentoIcon>
          <BentoTitle>insights & analytics</BentoTitle>
          <BentoText>
            Keep track of your progress every session and watch your results
            soar! Get ready to see amazing results!
          </BentoText>
        </BentoItem>
        <BentoItem className="lg:[grid-area:card-two]">
          <BentoIcon>💻</BentoIcon>
          <BentoTitle>cross platform</BentoTitle>
          <BentoText>
            Seamlessly switch between devices and access your workout data
            anytime, anywhere. Our platform is compatible with desktop, mobile,
            and tablet devices, ensuring you can stay connected and motivated on
            the go.
          </BentoText>
        </BentoItem>
        <BentoItem className="lg:[grid-area:card-three]">
          <BentoIcon>🤝</BentoIcon>
          <BentoTitle>open source</BentoTitle>
          <BentoText>
            If you&apos;re interested in the behind-the-scenes development of
            our platform, we invite you to explore the code on our{" "}
            <a
              href="https://github.com/augustinsorel/gym-graphs"
              className="underline decoration-wavy"
              target="_blank"
            >
              Github
            </a>
            ! We highly value feedback and contributions from our community.
            <br />
            <br />
            Your input and ideas play a crucial role in shaping the future of
            our platform, and we appreciate the collaborative spirit that drives
            us forward.
          </BentoText>
        </BentoItem>
        <BentoItem className="lg:[grid-area:card-four]">
          <BentoIcon>🧩</BentoIcon>
          <BentoTitle>customizable</BentoTitle>
          <BentoText>
            With our modular dashboards, you&apos;re in charge of your
            exercises! Customize your workout experience to fit your preferences
            and needs.
          </BentoText>
        </BentoItem>
        <BentoItem className="lg:[grid-area:card-five]">
          <BentoIcon>🎁</BentoIcon>
          <BentoTitle>100% free</BentoTitle>
          <BentoText>
            Great news! Our project is completely free to use, with no hidden
            fees or charges. We value your privacy and do not collect any
            personal information.
          </BentoText>
        </BentoItem>
      </BentoGrid>

      <GetStartedAction />
    </FeatureContainer>
  );
};

const Grid = (props: ComponentProps<"ol">) => {
  return (
    <ol
      className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,var(--dashboard-card-width)),1fr))] gap-5"
      {...props}
    />
  );
};

const Card = (props: ComponentProps<"li">) => {
  return (
    <li
      className="grid h-[300px] grid-rows-[auto_1fr] items-stretch justify-stretch rounded-md border bg-secondary p-0 [&_svg]:size-auto"
      {...props}
    />
  );
};

const Name = (props: ComponentProps<"h2">) => {
  return (
    <h2
      className="truncate border-b p-4 text-sm font-semibold capitalize"
      {...props}
    />
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main {...props} className="relative flex flex-col gap-32 sm:gap-56" />
  );
};

const HeroContainer = (props: ComponentProps<"section">) => {
  return <section {...props} className="relative flex min-h-[100dvh]" />;
};

const HeroContent = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="m-auto flex max-w-md flex-col items-center justify-center gap-14 p-5 sm:max-w-3xl"
    />
  );
};

const HeroTitle = (props: ComponentProps<"h1">) => {
  return (
    <h1
      {...props}
      className={cn(
        "text-center text-4xl font-bold first-letter:capitalize sm:text-7xl",
        props.className,
      )}
    />
  );
};

const GradientText = (props: ComponentProps<"strong">) => {
  return (
    <strong
      className="bg-brand-gradient bg-clip-text font-bold text-transparent"
      {...props}
    />
  );
};

const StrongText = (props: ComponentProps<"strong">) => {
  return (
    <strong
      {...props}
      className={cn("font-semibold text-primary", props.className)}
    />
  );
};

const Text = (props: ComponentProps<"p">) => {
  return <p className="max-w-xl text-center sm:text-2xl" {...props} />;
};

const HeroBackgroundContainer = (props: ComponentProps<"div">) => {
  return <div {...props} className="absolute inset-0 -z-10" />;
};

const FeatureContainer = ({
  className,
  ...props
}: ComponentProps<"section">) => {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-app flex-col items-center gap-14 p-5",
        className,
      )}
      {...props}
    />
  );
};

const CardTwo = ({ className, ...props }: ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "relative w-full rounded-md border bg-secondary",
        className,
      )}
      {...props}
    />
  );
};

const Separator = () => {
  return (
    <svg className="absolute bottom-0 left-0 -z-10 h-[200px] w-full translate-y-[100px]">
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

const GetStartedAction = () => {
  return (
    <Button
      asChild
      variant="secondary"
      className="bg-foreground capitalize text-background hover:bg-foreground/80"
    >
      <Link to="/sign-in">
        <span className="sm:text-xl">get started</span>
        <ArrowRight />
      </Link>
    </Button>
  );
};

const BentoGrid = (props: ComponentProps<"ul">) => {
  return (
    <ul
      {...props}
      className='grid grid-cols-1 gap-5 lg:grid-cols-7 lg:grid-rows-2 lg:[grid-template-areas:"card-one_card-one_card-two_card-two_card-two_card-three_card-three""card-four_card-four_card-four_card-five_card-five_card-three_card-three"]'
    />
  );
};

const BentoItem = (props: ComponentProps<"li">) => {
  return (
    <li
      {...props}
      className={cn(
        "space-y-3 rounded-md border border-border bg-secondary p-7 text-2xl font-semibold",
        props.className,
      )}
    />
  );
};

const BentoIcon = (props: ComponentProps<"span">) => {
  return <span className="" {...props} />;
};

const BentoTitle = (props: ComponentProps<"h2">) => {
  return <h2 {...props} className="capitalize" />;
};

const BentoText = (props: ComponentProps<"p">) => {
  return <p className="text-lg font-normal text-muted-foreground" {...props} />;
};
