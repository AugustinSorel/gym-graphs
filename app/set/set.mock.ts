import { exercisesMock } from "~/exercise/exercise.mock";
import { transformSetsToHeatMap } from "~/set/set.services";
import { selectSetsHeatMapAction } from "./set.actions";

export const setsHeatMapMock: Awaited<
  ReturnType<typeof selectSetsHeatMapAction>
> = transformSetsToHeatMap(exercisesMock.flatMap((e) => e.sets));
