import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ExerciseAdvanceOverviewGraph } from "~/exercise/components/exercise-advanced-overview-graph";
import { ExerciseOverviewGraph } from "~/exercise/components/exercise-overview-graph";
import { ExerciseTable } from "~/exercise/components/exercise-table";
import { homePageExerciseTableColumns } from "~/exercise/components/exercise-table-columns";
import { TilesToSetsCountGraph } from "~/dashboard/components/tiles-to-sets-count-graph";
import { exercisesMock } from "~/exercise/exercise.mock";
import { cn } from "~/styles/styles.utils";
import { Button } from "~/ui/button";
import { HeroBackground } from "~/ui/hero-background";
import { userQueries } from "~/user/user.queries";
import { userMock } from "~/user/user.mock";
import { TilesFunFacts } from "~/dashboard/components/tiles-fun-facts";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { setsMock } from "~/set/set.mock";
import {
  dashboardFunFactsMock,
  tilesSetsHeatMapMock,
  tilesToSetsCountMock,
  tilesToTagsCount,
} from "~/dashboard/dashboard.mock";
import { permissions } from "~/libs/permissions";
import { TilesToTagsCountGraph } from "~/dashboard/components/tiles-to-tags-count-graph";
import { TilesSetsHeatMapGraph } from "~/dashboard/components/tiles-sets-heat-map-graph";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/")({
  component: () => Home(),
  beforeLoad: async ({ context }) => {
    permissions.homePage.view(context.user);
  },
});

const Home = () => {
  const mockQueryClient = useMockQueryClient();

  return (
    <QueryClientProvider client={mockQueryClient}>
      <Main>
        <HeroSection />

        <FeatureOne />

        <FeatureTwo />

        <HeroSectionTwo />
      </Main>
    </QueryClientProvider>
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

        <Button
          asChild
          variant="secondary"
          className="bg-foreground text-background hover:bg-foreground/80 capitalize"
        >
          <Link to="/sign-in">
            <span className="sm:text-xl">get started</span>
            <ArrowRight />
          </Link>
        </Button>
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
            <Name>{exercise.tile.name}</Name>
            <ExerciseOverviewGraph sets={exercise.sets} />
          </Card>
        ))}
        <Card>
          <Name>exercises frequency</Name>
          <TilesToSetsCountGraph />
        </Card>
        <Card>
          <Name>tags frequency</Name>
          <TilesToTagsCountGraph />
        </Card>
        <Card>
          <Name>fun facts</Name>
          <TilesFunFacts />
        </Card>
        <Card>
          <Name>heat map - January</Name>
          <TilesSetsHeatMapGraph />
        </Card>
      </Grid>
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

      <CardTwo className="py-2 sm:p-4">
        <ExerciseAdvanceOverviewGraph sets={setsMock} />
      </CardTwo>
      <CardTwo>
        <ExerciseTable sets={setsMock} columns={homePageExerciseTableColumns} />
      </CardTwo>
    </FeatureContainer>
  );
};

const HeroSectionTwo = () => {
  return (
    <HeroContainerTwo>
      <HeroTitle>
        <GradientText>Effortlessly </GradientText>Track Your Fitness Journey
      </HeroTitle>

      <Text className="max-w-3xl">
        Gym-tracker is a <StrongText>free</StrongText>, intuitive platform
        designed to simplify your workout monitoring. Featuring interactive
        graphs, detailed heat maps, and customizable dashboards.
      </Text>

      <Button className="font-semibold" asChild>
        <Link to="/sign-in">
          <span>Get started</span>
          <ArrowRight aria-label="arrow-right" />
        </Link>
      </Button>

      <CirclesBluredBg />
    </HeroContainerTwo>
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
      className="bg-secondary grid h-[300px] grid-rows-[auto_1fr] items-stretch justify-stretch rounded-md border p-0 [&_svg]:size-auto"
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
    <main
      {...props}
      className="relative flex flex-col gap-32 overflow-x-clip pb-32 sm:gap-56"
    />
  );
};

const HeroContainer = (props: ComponentProps<"section">) => {
  return <section {...props} className="relative" />;
};

const HeroContainerTwo = (props: ComponentProps<"section">) => {
  return (
    <section
      className="relative mx-auto flex max-w-md flex-col items-center justify-center gap-6 p-5 sm:max-w-3xl"
      {...props}
    />
  );
};

const HeroContent = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto flex min-h-[calc(100dvh-var(--header-height))] max-w-md flex-col items-center justify-center gap-6 p-5 sm:max-w-3xl"
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
      className={cn("text-primary font-semibold", props.className)}
    />
  );
};

const Text = ({ className, ...props }: ComponentProps<"p">) => {
  return (
    <p
      className={cn("max-w-xl text-center sm:text-2xl", className)}
      {...props}
    />
  );
};

const HeroBackgroundContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="absolute -top-[var(--header-height)] right-0 bottom-0 left-0 -z-10"
    />
  );
};

const FeatureContainer = ({
  className,
  ...props
}: ComponentProps<"section">) => {
  return (
    <section
      className={cn(
        "max-w-app mx-auto flex w-full flex-col items-center gap-14 p-5",
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
        "bg-secondary relative w-full rounded-md border",
        className,
      )}
      {...props}
    />
  );
};

const Separator = () => {
  return (
    <svg className="absolute bottom-0 left-0 -z-10 h-[200px] w-[150%] -translate-x-1/4 translate-y-[100px] blur-md">
      <ellipse
        cx="50%"
        cy="50%"
        rx="60%"
        ry="40px"
        className="fill-background sm:[ry:80px]"
      />
    </svg>
  );
};

const CirclesBluredBg = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute top-auto right-[calc(50%-6rem)] bottom-0 left-0 -z-10 flex justify-end blur-3xl dark:opacity-20"
      >
        <div className="aspect-1155/678 w-[70rem] flex-none bg-linear-to-r from-pink-400 to-indigo-400 opacity-25 [clip-path:polygon(73.6%_48.6%,_91.7%_88.5%,_100%_53.9%,_97.4%_18.1%,_92.5%_15.4%,_75.7%_36.3%,_55.3%_52.8%,_46.5%_50.9%,_45%_37.4%,_50.3%_13.1%,_21.3%_36.2%,_0.1%_0.1%,_5.4%_49.1%,_21.4%_36.4%,_58.9%_100%,_73.6%_48.6%)]" />
      </div>

      <div
        aria-hidden="true"
        className="absolute top-full right-0 left-1/2 -z-10 hidden -translate-y-3/4 blur-3xl lg:block dark:opacity-20"
      >
        <div className="aspect-1155/678 w-[70rem] flex-none bg-linear-to-r from-pink-400 to-indigo-400 opacity-30 [clip-path:polygon(74.1%_44.1%,_100%_61.6%,_97.5%_26.9%,_85.5%_0.1%,_80.7%_2%,_72.5%_32.5%,_60.2%_62.4%,_52.4%_68.1%,_47.5%_58.3%,_45.2%_34.5%,_27.5%_76.7%,_0.1%_64.9%,_17.9%_100%,_27.6%_76.8%,_76.1%_97.7%,_74.1%_44.1%)]" />
      </div>
    </>
  );
};

const useMockQueryClient = () => {
  const queryClient = new QueryClient();

  const queries = {
    user: userQueries.get.queryKey,
    tilesToSetsCount: dashboardQueries.tilesToSetsCount.queryKey,
    setsHeatMap: dashboardQueries.tilesSetsHeatMap.queryKey,
    funFacts: dashboardQueries.funFacts.queryKey,
    tilesToTagsCount: dashboardQueries.tilesToTagsCount.queryKey,
  } as const;

  queryClient.setQueryData(queries.user, userMock);
  queryClient.setQueryData(queries.tilesToSetsCount, tilesToSetsCountMock);
  queryClient.setQueryData(queries.setsHeatMap, tilesSetsHeatMapMock);
  queryClient.setQueryData(queries.funFacts, dashboardFunFactsMock);
  queryClient.setQueryData(queries.tilesToTagsCount, tilesToTagsCount);

  queryClient.setDefaultOptions({
    queries: {
      staleTime: Infinity,
    },
  });

  return queryClient;
};
