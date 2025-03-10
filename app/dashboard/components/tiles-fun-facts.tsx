import { WeightUnit } from "~/weight-unit/components/weight-unit";
import { WeightValue } from "~/weight-unit/components/weight-value";
import { CatchBoundary } from "@tanstack/react-router";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import {
  Carousel,
  CarouselBody,
  CarouselDot,
  CarouselItem,
} from "~/ui/carousel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { Skeleton } from "~/ui/skeleton";
import type { ComponentProps } from "react";

export const TilesFunFacts = () => {
  const funFacts = useTilesFunFacts();

  if (!funFacts.data.totalRepetitions) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <Carousel>
      <CarouselBody>
        {FunFacts.map((FunFact, i) => (
          <CarouselItem
            className="grid grid-rows-[1fr_auto_1fr] gap-y-3 p-3 text-center select-none"
            key={i}
          >
            <CatchBoundary
              getResetKey={() => "reset"}
              errorComponent={DefaultErrorFallback}
            >
              <FunFact />
            </CatchBoundary>
          </CarouselItem>
        ))}
      </CarouselBody>

      <CarouselDotsContainer>
        {FunFacts.map((_FunFact, i) => (
          <CarouselDot key={i} index={i} />
        ))}
      </CarouselDotsContainer>
    </Carousel>
  );
};

const WeightLiftedFunFact = () => {
  const funFacts = useTilesFunFacts();

  return (
    <>
      <Text>weight lifted</Text>
      <Strong>
        <WeightValue weightInKg={funFacts.data.totalWeightInKg} />{" "}
        <WeightUnit />
      </Strong>
    </>
  );
};

const NumberOfRepetitions = () => {
  const funFacts = useTilesFunFacts();

  return (
    <>
      <Text>number of reps</Text>
      <Strong>{funFacts.data.totalRepetitions}</Strong>
    </>
  );
};

const FavoriteExercise = () => {
  const funFacts = useTilesFunFacts();

  return (
    <>
      <Text>favorite exercise</Text>
      <Strong>{funFacts.data.tileWithMostSets.name}</Strong>
    </>
  );
};

const LeastFavoriteExercise = () => {
  const funFacts = useTilesFunFacts();

  return (
    <>
      <Text>least favorite exercise</Text>
      <Strong>{funFacts.data.tileWithLeastSets.name}</Strong>
    </>
  );
};

const Text = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground mt-auto truncate" {...props} />;
};

const Strong = (props: ComponentProps<"strong">) => {
  return (
    <strong
      className="bg-brand-gradient truncate bg-clip-text py-1 text-5xl font-bold text-transparent"
      {...props}
    />
  );
};

const CarouselDotsContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 space-x-3 p-3"
      {...props}
    />
  );
};

const NoDataText = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground m-auto text-sm" {...props} />;
};

export const TilesFunFactsSkeleton = () => {
  return (
    <div className="grid grid-rows-[1fr_auto_1fr] justify-items-center gap-7 p-3 text-center">
      <Skeleton className="bg-border mt-auto h-3 w-32 rounded-full" />

      <Skeleton className="bg-border h-7 w-48 rounded-full" />

      <div className="mt-auto flex gap-3">
        {FunFacts.map((_FunFact, i) => (
          <Skeleton className="bg-border size-5 rounded-full" key={i} />
        ))}
      </div>
    </div>
  );
};

const useTilesFunFacts = () => {
  return useSuspenseQuery(dashboardQueries.funFacts);
};

const FunFacts = [
  WeightLiftedFunFact,
  NumberOfRepetitions,
  FavoriteExercise,
  LeastFavoriteExercise,
] as const;
