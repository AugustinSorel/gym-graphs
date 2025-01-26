import {
  Carousel,
  CarouselContent,
  CarouselDot,
  CarouselItem,
} from "~/ui/carousel";
import { WeightUnit } from "~/weight-unit/components/weight-unit";
import { useExercises } from "../hooks/useExericses";
import { WeightValue } from "~/weight-unit/components/weight-value";
import { CatchBoundary } from "@tanstack/react-router";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import type { ComponentProps } from "react";

export const ExercisesFunFacts = () => {
  const FunFacts = [
    WeightLiftedFunFact,
    NumberOfSets,
    FavoriteExercise,
    LeastFavoriteExercise,
  ];

  return (
    <Carousel opts={{ align: "start" }} className="flex w-full">
      <CarouselContent className="h-full w-full">
        {FunFacts.map((FunFact, i) => (
          <CarouselItem
            className="grid select-none grid-rows-[1fr_auto_1fr] gap-y-3 p-3 text-center"
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
      </CarouselContent>

      <CarouselDotsContainer>
        {FunFacts.map((_FunFact, i) => (
          <CarouselDot key={i} index={i} />
        ))}
      </CarouselDotsContainer>
    </Carousel>
  );
};

const WeightLiftedFunFact = () => {
  const weightLiftedInKg = useCalculateWeightLiftedInKg();

  return (
    <>
      <Text>weight lifted</Text>
      <Strong>
        <WeightValue weightInKg={weightLiftedInKg} /> <WeightUnit />
      </Strong>
    </>
  );
};

const NumberOfSets = () => {
  const numberOfSets = useNumberOfSets();

  return (
    <>
      <Text>number of sets</Text>
      <Strong>{numberOfSets}</Strong>
    </>
  );
};

const FavoriteExercise = () => {
  const favoriteExercise = useFavoriteExercise();

  if (!favoriteExercise) {
    return (
      <>
        <Text>favorite exercise</Text>
        <Strong>unknown</Strong>
      </>
    );
  }

  return (
    <>
      <Text>favorite exercise</Text>
      <Strong>{favoriteExercise.name}</Strong>
    </>
  );
};

const LeastFavoriteExercise = () => {
  const leastFavoriteExercise = useLeastFavoriteExercise();

  if (!leastFavoriteExercise) {
    return (
      <>
        <Text>least favorite exercise</Text>
        <Strong>unknown</Strong>
      </>
    );
  }

  return (
    <>
      <Text>least favorite exercise</Text>
      <Strong>{leastFavoriteExercise.name}</Strong>
    </>
  );
};

const useCalculateWeightLiftedInKg = () => {
  const exercises = useExercises();

  return exercises.data.reduce((acc, curr) => {
    return (
      acc +
      curr.sets.reduce((acc, curr) => {
        return acc + curr.weightInKg;
      }, 0)
    );
  }, 0);
};

const useNumberOfSets = () => {
  const exercises = useExercises();

  return exercises.data.reduce((acc, curr) => {
    return acc + curr.sets.length;
  }, 0);
};

const useFavoriteExercise = () => {
  const exercises = useExercises();

  return exercises.data.reduce<(typeof exercises)["data"][number] | null>(
    (acc, curr) => {
      if (!acc) {
        return curr;
      }

      const candidateNumberOfSets = curr.sets.length;
      const currentNumberOfSets = acc?.sets.length;

      if (candidateNumberOfSets > currentNumberOfSets) {
        return curr;
      }

      return acc;
    },
    null,
  );
};

const useLeastFavoriteExercise = () => {
  const exercises = useExercises();

  return exercises.data.reduce<(typeof exercises)["data"][number] | null>(
    (acc, curr) => {
      if (!acc) {
        return curr;
      }

      const candidateNumberOfSets = curr.sets.length;
      const currentNumberOfSets = acc.sets.length;

      if (candidateNumberOfSets <= currentNumberOfSets) {
        return curr;
      }

      return acc;
    },
    null,
  );
};

const Text = (props: ComponentProps<"p">) => {
  return <p className="mt-auto truncate text-muted-foreground" {...props} />;
};

const Strong = (props: ComponentProps<"strong">) => {
  return (
    <strong
      className="truncate bg-brand-gradient bg-clip-text py-1 text-5xl font-bold text-transparent"
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
