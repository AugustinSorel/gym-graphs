import { CatchBoundary, createFileRoute } from "@tanstack/react-router";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { DefaultFallback } from "~/ui/fallback";
import { Suspense } from "react";
import type { ComponentProps } from "react";
import { cn } from "~/styles/styles.utils";
import {
  StatsFavoriteExerciseCard,
  StatsFavoriteExerciseCardSkeleton,
} from "~/domains/stats/components/stats-favorite-exercise-card";
import {
  StatsLeastFavoriteExerciseCard,
  StatsLeastFavoriteExerciseCardSkeleton,
} from "~/domains/stats/components/stats-least-favorite-exercise-card";
import {
  StatsHeatMap,
  StatsHeatMapSkeleton,
} from "~/domains/stats/components/stats-heat-map";
import {
  StatsRadar,
  StatsRadarSkeleton,
} from "~/domains/stats/components/stats-radar";
import {
  StatsPie,
  StatsPieSkeleton,
} from "~/domains/stats/components/stats-pie";
import {
  StatsTotalWeightCard,
  StatsTotalWeightCardSkeleton,
} from "~/domains/stats/components/stats-total-weight-card";
import {
  StatsTotalRepsCard,
  StatsTotalRepsCardSkeleton,
} from "~/domains/stats/components/stats-total-reps-card";
import { Separator } from "~/ui/separator";

export const Route = createFileRoute("/(authed)/stats")({
  component: () => RouteComponent(),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(exerciseQueries.stats);
  },
});

const RouteComponent = () => {
  return (
    <Main>
      <Header>
        <Title>stats</Title>
      </Header>

      <Separator />

      <BentoGrid>
        <CatchBoundary
          errorComponent={DefaultFallback}
          getResetKey={() => "reset"}
        >
          <BentoCell>
            <BentoCellTitle>favorite exercise</BentoCellTitle>
            <Suspense fallback={<StatsFavoriteExerciseCardSkeleton />}>
              <StatsFavoriteExerciseCard />
            </Suspense>
          </BentoCell>
        </CatchBoundary>

        <CatchBoundary
          errorComponent={DefaultFallback}
          getResetKey={() => "reset"}
        >
          <BentoCell>
            <BentoCellTitle>least favorite exercise</BentoCellTitle>
            <Suspense fallback={<StatsLeastFavoriteExerciseCardSkeleton />}>
              <StatsLeastFavoriteExerciseCard />
            </Suspense>
          </BentoCell>
        </CatchBoundary>

        <CatchBoundary
          errorComponent={DefaultFallback}
          getResetKey={() => "reset"}
        >
          <BentoCell>
            <BentoCellTitle>total weight lifted</BentoCellTitle>
            <Suspense fallback={<StatsTotalWeightCardSkeleton />}>
              <StatsTotalWeightCard />
            </Suspense>
          </BentoCell>
        </CatchBoundary>

        <CatchBoundary
          errorComponent={DefaultFallback}
          getResetKey={() => "reset"}
        >
          <BentoCell>
            <BentoCellTitle>total repetitions</BentoCellTitle>
            <Suspense fallback={<StatsTotalRepsCardSkeleton />}>
              <StatsTotalRepsCard />
            </Suspense>
          </BentoCell>
        </CatchBoundary>

        <CatchBoundary
          errorComponent={DefaultFallback}
          getResetKey={() => "reset"}
        >
          <BentoCell className="col-span-2 min-h-48">
            <BentoCellTitle>this month</BentoCellTitle>
            <Suspense fallback={<StatsHeatMapSkeleton />}>
              <StatsHeatMap />
            </Suspense>
          </BentoCell>
        </CatchBoundary>

        <CatchBoundary
          errorComponent={DefaultFallback}
          getResetKey={() => "reset"}
        >
          <BentoCell className="col-span-2 min-h-80">
            <BentoCellTitle>sets per exercise</BentoCellTitle>
            <Suspense fallback={<StatsRadarSkeleton />}>
              <StatsRadar />
            </Suspense>
          </BentoCell>
        </CatchBoundary>

        <CatchBoundary
          errorComponent={DefaultFallback}
          getResetKey={() => "reset"}
        >
          <BentoCell className="col-span-2 min-h-80">
            <BentoCellTitle>sets per tag</BentoCellTitle>
            <Suspense fallback={<StatsPieSkeleton />}>
              <StatsPie />
            </Suspense>
          </BentoCell>
        </CatchBoundary>
      </BentoGrid>
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 px-2 pt-10 pb-20 sm:px-4 lg:gap-20 lg:pt-20"
      {...props}
    />
  );
};

const BentoGrid = (props: ComponentProps<"div">) => {
  return (
    <div
      className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4"
      {...props}
    />
  );
};

const BentoCell = ({ className, ...props }: ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "bg-secondary relative grid max-h-96 grid-rows-[auto_1fr] gap-2 overflow-hidden rounded-xl border p-4 text-center lg:text-left [&>*:nth-child(2)]:place-self-center",
        className,
      )}
      {...props}
    />
  );
};

const BentoCellTitle = (props: ComponentProps<"h2">) => {
  return (
    <h2
      className="text-muted-foreground text-xs tracking-wider lg:text-sm"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid gap-2" {...props} />;
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};
