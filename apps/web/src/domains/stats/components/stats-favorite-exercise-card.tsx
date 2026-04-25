import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { Skeleton } from "~/ui/skeleton";

export const StatsFavoriteExerciseCard = () => {
  const stats = useSuspenseQuery(exerciseQueries.stats);
  const name = stats.data.exerciseWithMostSets?.name ?? "-";

  return (
    <span className="my-3 text-center text-xl font-bold first-letter:capitalize lg:my-10 lg:text-3xl">
      {name}
    </span>
  );
};

export const StatsFavoriteExerciseCardSkeleton = () => {
  return <Skeleton className="bg-border h-7 w-48 rounded-full" />;
};
