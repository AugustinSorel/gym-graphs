import { exercisesMock } from "~/exercise/exercise.mock";
import { transformSetsToHeatMap } from "~/set/set.services";

export const setsHeatMapMock = transformSetsToHeatMap(
  exercisesMock.flatMap((e) => e.sets),
);
