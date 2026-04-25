import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import {
  SetsHeatMap,
  SetsHeatMapSkeleton,
} from "~/domains/set/components/sets-heat-map";

export const StatsHeatMap = () => {
  const stats = useSuspenseQuery(exerciseQueries.stats);

  return <SetsHeatMap sets={stats.data.allSets} />;
};

export { SetsHeatMapSkeleton as StatsHeatMapSkeleton };
