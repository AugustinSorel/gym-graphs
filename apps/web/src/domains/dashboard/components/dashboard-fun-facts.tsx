import { WeightUnit } from "~/domains/user/components/weight-unit";
import { WeightValue } from "~/domains/user/components/weight-value";
import {
  Carousel,
  CarouselBody,
  CarouselDot,
  CarouselItem,
} from "~/ui/carousel";
import { Skeleton } from "~/ui/skeleton";
import { useTiles } from "~/domains/tile/hooks/use-tiles";
import type { ComponentProps } from "react";

export const DashboardFunFacts = () => {
  const funFacts = useDashboardFunFacts();

  if (!funFacts.totalRepetitions) {
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
            <FunFact />
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
  const funFacts = useDashboardFunFacts();

  return (
    <>
      <Text>weight lifted</Text>
      <Strong>
        <WeightValue weightInKg={funFacts.totalWeightInKg} /> <WeightUnit />
      </Strong>
    </>
  );
};

const NumberOfRepetitions = () => {
  const funFacts = useDashboardFunFacts();

  return (
    <>
      <Text>number of reps</Text>
      <Strong>{funFacts.totalRepetitions}</Strong>
    </>
  );
};

const FavoriteExercise = () => {
  const funFacts = useDashboardFunFacts();

  return (
    <>
      <Text>favorite exercise</Text>
      <Strong>{funFacts.tileWithMostSets.name}</Strong>
    </>
  );
};

const LeastFavoriteExercise = () => {
  const funFacts = useDashboardFunFacts();

  return (
    <>
      <Text>least favorite exercise</Text>
      <Strong>{funFacts.tileWithLeastSets.name}</Strong>
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

const useDashboardFunFacts = () => {
  const tiles = useTiles().data.filter((tile) => {
    return tile.type === "exerciseOverview";
  });

  const sets = tiles.flatMap((tile) => tile.exerciseOverview.exercise.sets);

  const totalWeightInKg = sets.reduce((acc, set) => {
    return acc + set.repetitions * set.weightInKg;
  }, 0);

  const totalRepetitions = sets.reduce((acc, set) => {
    return acc + set.repetitions;
  }, 0);

  const tilesOrderedBySetCount = tiles.toSorted((a, b) => {
    return a.exerciseOverview.exercise.sets.length >
      b.exerciseOverview.exercise.sets.length
      ? -1
      : 1;
  });

  const tileWithMostSets = {
    name: tilesOrderedBySetCount.at(0)?.name ?? "unknown",
  };

  const tileWithLeastSets = {
    name: tilesOrderedBySetCount.at(-1)?.name ?? "unknown",
  };

  return {
    totalWeightInKg,
    totalRepetitions,
    tileWithMostSets,
    tileWithLeastSets,
  };
};

const FunFacts = [
  WeightLiftedFunFact,
  NumberOfRepetitions,
  FavoriteExercise,
  LeastFavoriteExercise,
] as const;
