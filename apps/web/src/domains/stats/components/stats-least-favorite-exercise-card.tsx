import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { Skeleton } from "~/ui/skeleton";

export const StatsLeastFavoriteExerciseCard = () => {
  const stats = useSuspenseQuery(exerciseQueries.stats);
  const name = stats.data.exerciseWithLeastSets?.name ?? "-";

  return (
    <span className="my-3 text-center text-xl font-bold first-letter:capitalize lg:my-10 lg:text-2xl">
      {name}
    </span>
  );
};

export const StatsLeastFavoriteExerciseCardSkeleton = () => {
  return <Skeleton className="bg-border h-7 w-48 rounded-full" />;
};
