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
import { createContext, use } from "react";
import { useDashboardTiles } from "~/user/hooks/use-dashboard-tiles";
import type { ComponentProps } from "react";

export const ExercisesFunFacts = (props: Props) => {
  const FunFacts = [
    WeightLiftedFunFact,
    NumberOfSets,
    FavoriteExercise,
    LeastFavoriteExercise,
  ];

  return (
    <Ctx value={props.exercises}>
      <Carousel>
        <CarouselBody>
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
        </CarouselBody>

        <CarouselDotsContainer>
          {FunFacts.map((_FunFact, i) => (
            <CarouselDot key={i} index={i} />
          ))}
        </CarouselDotsContainer>
      </Carousel>
    </Ctx>
  );
};

type Exercise = Readonly<
  NonNullable<ReturnType<typeof useDashboardTiles>["data"][number]["exercise"]>
>;

type Props = Readonly<{
  exercises: ReadonlyArray<Exercise>;
}>;

const Ctx = createContext<ReadonlyArray<Exercise> | undefined>(undefined);

const useExercises = () => {
  const ctx = use(Ctx);

  if (!ctx) {
    throw new Error("");
  }

  return ctx;
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

  return exercises.reduce((acc, curr) => {
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

  return exercises.reduce((acc, curr) => {
    return acc + curr.sets.length;
  }, 0);
};

const useFavoriteExercise = () => {
  const exercises = useExercises();

  return exercises.reduce<Exercise | null>((acc, curr) => {
    if (!acc) {
      return curr;
    }

    const candidateNumberOfSets = curr.sets.length;
    const currentNumberOfSets = acc?.sets.length;

    if (candidateNumberOfSets > currentNumberOfSets) {
      return curr;
    }

    return acc;
  }, null);
};

const useLeastFavoriteExercise = () => {
  const exercises = useExercises();

  return exercises.reduce<Exercise | null>((acc, curr) => {
    if (!acc) {
      return curr;
    }

    const candidateNumberOfSets = curr.sets.length;
    const currentNumberOfSets = acc.sets.length;

    if (candidateNumberOfSets <= currentNumberOfSets) {
      return curr;
    }

    return acc;
  }, null);
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
