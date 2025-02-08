import { queryOptions } from "@tanstack/react-query";
import { selectSetsHeatMapAction } from "./set.actions";

const heatMap = queryOptions({
  queryKey: ["sets", "heatMap"],
  queryFn: () => selectSetsHeatMapAction(),
});

export const setKeys = {
  heatMap,
} as const;
