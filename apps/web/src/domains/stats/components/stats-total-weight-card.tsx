import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { WeightValue } from "~/domains/user/components/weight-value";
import { Skeleton } from "~/ui/skeleton";

export const StatsTotalWeightCard = () => {
  const stats = useSuspenseQuery(exerciseQueries.stats);

  return (
    <span className="my-3 text-center text-xl font-bold lg:my-6 lg:text-2xl">
      <WeightValue weightInKg={stats.data.totalWeightInKg} /> <WeightUnit />
    </span>
  );
};

export const StatsTotalWeightCardSkeleton = () => {
  return <Skeleton className="bg-border h-7 w-48 rounded-full" />;
};
