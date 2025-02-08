import { exercisesMock } from "~/exercise/exercise.mock";
import { transformSetsToHeatMap } from "~/set/set.services";
import type { SetsHeatMapData } from "~/set/components/sets-heat-map-graph";

export const setsHeatMapMock: SetsHeatMapData = transformSetsToHeatMap(
  exercisesMock.flatMap((e) => e.sets),
);
