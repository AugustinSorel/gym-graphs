import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/ui/heroBackground";
import { cn } from "@/lib/utils";
import { ArrowRight, GripVertical, MoreHorizontal, Tag } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";
import { mockExercises } from "@/lib/mock-data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { GridLayout } from "@/components/ui/gridLayout";
import { Card } from "@/components/ui/card";
import { LineGraph } from "@/components/graphs/lineGraph";
import { RadarGraph } from "@/components/graphs/radarGraph";
import { HeatmapGraph } from "@/components/graphs/heatmapGraph";
import { prepareHeatmapData } from "@/components/graphs/heatmapUtils";
import { RandomFacts } from "@/components/graphs/randomFacts";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { ExercisePageContextProvider } from "./exercises/[id]/_components/exercisePageContext";
import { ExerciseDataTableCardDummy } from "./exercises/[id]/_exerciseDataTable/exerciseDataTableCard";
import { ExerciseDataGraphCard } from "./exercises/[id]/_exerciseDataGraph/exerciseDataGraphCard";
import { Timeline } from "@/components/ui/timeline";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const HomePage = async () => {
  const session = await getServerAuthSession();

  if (session?.user.id) {
    return redirect("/dashboard");
  }

  return (
    <MainContainer>
      <HeroSection />

      <FeatureOne />

      <FeatureTwo />

      <FeatureThree />

      <FeatuesGrid />
    </MainContainer>
  );
};

export default HomePage;

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

      <Timeline className="w-full max-w-[calc(var(--exercise-card-height)*4+20px*5)] first-of-type:mt-0">
        <Badge variant="accent" className="mr-auto">
          <time dateTime="all">
            {new Date().toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </time>
        </Badge>
        <GridLayout>
          {mockExercises.map((exercise) => (
            <Card.Root key={exercise.id}>
              <Card.Header>
                <Card.Title>{exercise.name}</Card.Title>

                <Card.ActionContainer>
                  <Card.ActionButton aria-label="view exercise tags">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Tag className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">tags</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card.ActionButton>

                  <Card.ActionButton aria-label="view more">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <MoreHorizontal className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">view more</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card.ActionButton>

                  <Card.ActionButton aria-label="view more">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <GripVertical className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">drag exercise</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card.ActionButton>
                </Card.ActionContainer>
              </Card.Header>

              <LineGraph data={exercise.data} />
            </Card.Root>
          ))}

          <Card.Root>
            <Card.Header>
              <Card.Title>exercises count</Card.Title>
            </Card.Header>

            <RadarGraph
              data={mockExercises.map((exercise) => ({
                exerciseName: exercise.name,
                frequency: exercise.data.length,
              }))}
            />
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title>heatmap</Card.Title>
            </Card.Header>

            <HeatmapGraph data={prepareHeatmapData(mockExercises)} />
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title>random facts</Card.Title>
            </Card.Header>

            <RandomFacts exercises={mockExercises} />
          </Card.Root>
        </GridLayout>
      </Timeline>
      <FeaturesGridBackground />
    </FeatureContainer>
  );
};

const FeatureTwo = () => {
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

      <div className="w-full max-w-[calc(var(--exercise-card-height)*4+20px*5)] space-y-10">
        <ExercisePageContextProvider exercise={mockExercises[0]!}>
          <ExerciseDataGraphCard />
          <ExerciseDataTableCardDummy />
        </ExercisePageContextProvider>
      </div>

      <FeaturesGridBackground />
    </FeatureContainer>
  );
};

const FeatureThree = () => {
  return (
    <FeatureContainer>
      <HeroTitle>
        Empower Your <GradientText>Team!</GradientText>
      </HeroTitle>

      <Text>
        Create exercises and track your friends&apos; performance in real-time.
        Collaborate, compete, and conquer your fitness{" "}
        <StrongText>goals together</StrongText>, making every workout a shared
        experience.
      </Text>

      <Timeline className="w-full max-w-[calc(var(--exercise-card-height)*4+20px*5)] first-of-type:mt-0">
        <Badge variant="accent" className="mr-auto">
          metadata
        </Badge>
        <GridLayout>
          <Card.Root>
            <Card.Header>
              <Card.Title>team name</Card.Title>
            </Card.Header>
            <StrongText className="m-auto overflow-hidden text-4xl capitalize">
              my team
            </StrongText>
          </Card.Root>
          <Card.Root>
            <Card.Header>
              <Card.Title>members (2)</Card.Title>
            </Card.Header>

            <ul className="divide-y-muted-foreground max-h-full space-y-3 divide-y overflow-auto p-5 [&>*:not(:first-child)]:pt-3">
              <li className="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] items-center gap-x-3 text-left">
                <Avatar className="row-span-2">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>

                <p className="truncate capitalize">micheal</p>

                <p className="truncate text-sm text-muted-foreground">
                  micheal@email.com
                </p>
              </li>
              <li className="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] items-center gap-x-3 text-left">
                <Avatar className="row-span-2">
                  <AvatarFallback>J</AvatarFallback>
                </Avatar>

                <p className="truncate capitalize">john</p>

                <p className="truncate text-sm text-muted-foreground">
                  john@email.com
                </p>
              </li>
            </ul>
          </Card.Root>
        </GridLayout>
      </Timeline>

      <Timeline className="-mt-14 w-full max-w-[calc(var(--exercise-card-height)*4+20px*5)]">
        <Badge variant="accent" className="mr-auto">
          micheal
        </Badge>
        <GridLayout>
          {mockExercises.map((exercise) => (
            <Card.Root key={exercise.id}>
              <Card.Header>
                <Card.Title>{exercise.name}</Card.Title>

                <Card.ActionContainer>
                  <Card.ActionButton aria-label="view exercise tags">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Tag className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">tags</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card.ActionButton>

                  <Card.ActionButton aria-label="view more">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <MoreHorizontal className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">view more</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card.ActionButton>

                  <Card.ActionButton aria-label="view more">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <GripVertical className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">drag exercise</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card.ActionButton>
                </Card.ActionContainer>
              </Card.Header>

              <LineGraph data={exercise.data} />
            </Card.Root>
          ))}

          <Card.Root>
            <Card.Header>
              <Card.Title>exercises count</Card.Title>
            </Card.Header>

            <RadarGraph
              data={mockExercises.map((exercise) => ({
                exerciseName: exercise.name,
                frequency: exercise.data.length,
              }))}
            />
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title>random facts</Card.Title>
            </Card.Header>

            <RandomFacts exercises={mockExercises} />
          </Card.Root>
        </GridLayout>
      </Timeline>
      <Timeline className="-mt-14 w-full max-w-[calc(var(--exercise-card-height)*4+20px*5)]">
        <Badge variant="accent" className="mr-auto">
          john
        </Badge>
        <GridLayout>
          {mockExercises.slice(0, 2).map((exercise) => (
            <Card.Root key={exercise.id}>
              <Card.Header>
                <Card.Title>{exercise.name}</Card.Title>

                <Card.ActionContainer>
                  <Card.ActionButton aria-label="view exercise tags">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Tag className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">tags</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card.ActionButton>

                  <Card.ActionButton aria-label="view more">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <MoreHorizontal className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">view more</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card.ActionButton>

                  <Card.ActionButton aria-label="view more">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <GripVertical className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">drag exercise</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card.ActionButton>
                </Card.ActionContainer>
              </Card.Header>

              <LineGraph data={exercise.data} />
            </Card.Root>
          ))}

          <Card.Root>
            <Card.Header>
              <Card.Title>exercises count</Card.Title>
            </Card.Header>

            <RadarGraph
              data={mockExercises.map((exercise) => ({
                exerciseName: exercise.name,
                frequency: exercise.data.length,
              }))}
            />
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title>random facts</Card.Title>
            </Card.Header>

            <RandomFacts exercises={mockExercises} />
          </Card.Root>
        </GridLayout>
      </Timeline>
    </FeatureContainer>
  );
};

const FeatuesGrid = () => {
  return (
    <FeaturesGridContainer>
      <HeroTitle>what we offer</HeroTitle>

      <GridContainer>
        <I className="lg:[grid-area:card-one]">
          <CardIcon>📈</CardIcon>
          <CardTitle>insights & analytics</CardTitle>
          <CardText>
            Keep track of your progress every session and watch your results
            soar! Get ready to see amazing results!
          </CardText>
        </I>
        <I className="lg:[grid-area:card-two]">
          <CardIcon>💻</CardIcon>
          <CardTitle>cross platform</CardTitle>
          <CardText>
            Seamlessly switch between devices and access your workout data
            anytime, anywhere. Our platform is compatible with desktop, mobile,
            and tablet devices, ensuring you can stay connected and motivated on
            the go.
          </CardText>
        </I>
        <I className="lg:[grid-area:card-three]">
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
            our platform, and we appreciate the collaborative spirit that drives
            us forward.
          </CardText>
        </I>
        <I className="lg:[grid-area:card-four]">
          <CardIcon>🧩</CardIcon>
          <CardTitle>customizable</CardTitle>
          <CardText>
            With our modular dashboards, you&apos;re in charge of your
            exercises! Customize your workout experience to fit your preferences
            and needs.
          </CardText>
        </I>
        <I className="lg:[grid-area:card-five]">
          <CardIcon>🎁</CardIcon>
          <CardTitle>100% free</CardTitle>
          <CardText>
            Great news! Our project is completely free to use, with no hidden
            fees or charges. We value your privacy and do not collect any
            personal information.
          </CardText>
        </I>
      </GridContainer>

      <GetStartedAction />

      <FeaturesGridBackground />
    </FeaturesGridContainer>
  );
};

const MainContainer = (props: ComponentProps<"main">) => {
  return (
    <main
      {...props}
      className="relative flex flex-col gap-32 overflow-x-clip sm:gap-56"
    />
  );
};

const HeroContainer = (props: ComponentProps<"section">) => {
  return <section {...props} className="relative" />;
};

const HeroContent = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto flex min-h-[calc(100dvh-var(--header-height))] max-w-md flex-col items-center justify-center gap-14 p-5 sm:max-w-3xl"
    />
  );
};

const HeroBackgroundContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="absolute -top-[var(--header-height)] bottom-0 left-0 right-0 -z-10"
    />
  );
};

const FeatureContainer = (props: ComponentPropsWithoutRef<"section">) => {
  return (
    <section
      className="relative flex flex-col items-center gap-14 p-5"
      {...props}
    />
  );
};

const FeaturesGridContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="relative mx-auto flex max-w-7xl flex-col items-center gap-14 p-5"
    />
  );
};

const GridContainer = (props: ComponentProps<"ul">) => {
  return (
    <ul
      {...props}
      className='grid grid-cols-1 gap-5 lg:grid-cols-7 lg:grid-rows-2 lg:[grid-template-areas:"card-one_card-one_card-two_card-two_card-two_card-three_card-three""card-four_card-four_card-four_card-five_card-five_card-three_card-three"]'
    />
  );
};

//TODO: rename me
const I = (props: ComponentProps<"li">) => {
  return (
    <li
      {...props}
      className={twMerge(
        "space-y-3 rounded-md border border-border bg-primary p-7 text-2xl font-semibold backdrop-blur-md transition-colors hover:bg-border",
        props.className,
      )}
    />
  );
};

const CardIcon = (props: ComponentProps<"span">) => {
  return <span className="" {...props} />;
};

const CardTitle = (props: ComponentProps<"h2">) => {
  return <h2 {...props} className="capitalize" />;
};

const CardText = (props: ComponentProps<"p">) => {
  return <p className="text-lg font-normal text-muted-foreground" {...props} />;
};

const Text = (props: ComponentProps<"p">) => {
  return <p className="max-w-xl text-center sm:text-2xl" {...props} />;
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
      className={cn("font-semibold text-brand-color-two", props.className)}
    />
  );
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
        rx="300px"
        ry="200px"
        filter="url(#featuresGridBlur)"
        className="fill-brand-color-one opacity-20 dark:opacity-10"
      />
      <ellipse
        cx="70%"
        cy="70%"
        rx="300px"
        ry="200px"
        filter="url(#featuresGridBlur)"
        className="fill-brand-color-two opacity-20 dark:opacity-10"
      />
    </svg>
  );
};

//TODO: in team page, allow viewing exercises
//TODO: add random facts to team page eg heavier lifter or most active in team
//TODO: better sign in and join team email
//TODO: fix filtering that is slow
//TODO: test with low end network
//TODO: add e2e tests
//TODO: show points in brush line
