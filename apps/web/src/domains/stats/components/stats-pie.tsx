import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import {
  ExerciseTagCountGraph,
  ExerciseTagCountGraphSkeleton,
} from "~/domains/tag/components/exercise-tag-count-graph";

export const StatsPie = () => {
  const stats = useSuspenseQuery(exerciseQueries.stats);

  return <ExerciseTagCountGraph data={stats.data.setCountPerTag} />;
};

export { ExerciseTagCountGraphSkeleton as StatsPieSkeleton };
