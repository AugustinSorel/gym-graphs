import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { Skeleton } from "~/ui/skeleton";

export const StatsTotalRepsCard = () => {
  const stats = useSuspenseQuery(exerciseQueries.stats);

  return (
    <span className="my-3 text-center text-xl font-bold lg:my-6 lg:text-2xl">
      {stats.data.totalRepetitions.toLocaleString()}
    </span>
  );
};

export const StatsTotalRepsCardSkeleton = () => {
  return <Skeleton className="bg-border h-7 w-48 rounded-full" />;
};
