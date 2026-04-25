import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { ExerciseSetCountGraph } from "~/domains/set/components/exercise-set-count-graph";
import { Skeleton } from "~/ui/skeleton";

export const StatsRadar = () => {
  const stats = useSuspenseQuery(exerciseQueries.stats);

  return <ExerciseSetCountGraph data={stats.data.setCountPerExercise} />;
};

export const StatsRadarSkeleton = () => {
  return <Skeleton className="size-full rounded-md" />;
};
