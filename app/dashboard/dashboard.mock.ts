import { exercisesMock } from "~/exercise/exercise.mock";
import { transformSetsToHeatMap } from "~/set/set.services";
import type { selectTilesToTagsCount } from "~/dashboard/dashboard.services";
import type {
  selectTilesFunFactsAction,
  selectTilesSetsHeatMap,
  selectTilesToSetsCountAction,
} from "~/dashboard/dashboard.actions";

const exerciseWithMostSets = exercisesMock
  .toSorted((a, b) => b.sets.length - a.sets.length)
  .at(0);

const exerciseWithLeastSets = exercisesMock
  .toSorted((a, b) => a.sets.length - b.sets.length)
  .at(0);

const totalRepetitions = exercisesMock.reduce((acc, exercise) => {
  return (
    acc +
    exercise.sets.reduce((acc, set) => {
      return acc + set.repetitions;
    }, 0)
  );
}, 0);

const totalWeightInKg = exercisesMock.reduce((acc, exercise) => {
  return (
    acc +
    exercise.sets.reduce((acc, set) => {
      return acc + set.weightInKg * set.repetitions;
    }, 0)
  );
}, 0);

if (!exerciseWithMostSets || !exerciseWithLeastSets) {
  throw new Error("mock exercises is empty");
}

export const dashboardFunFactsMock: Readonly<
  Awaited<ReturnType<typeof selectTilesFunFactsAction>>
> = {
  tileWithMostSets: {
    name: exerciseWithMostSets.tile.name,
    setsCount: exerciseWithMostSets.sets.length,
  },
  tileWithLeastSets: {
    name: exerciseWithLeastSets.tile.name,
    setsCount: exerciseWithLeastSets.sets.length,
  },
  totalRepetitions,
  totalWeightInKg,
} as const;

export const tilesSetsHeatMapMock: Awaited<
  ReturnType<typeof selectTilesSetsHeatMap>
> = transformSetsToHeatMap(exercisesMock.flatMap((e) => e.sets));

export const tilesToSetsCountMock: Awaited<
  ReturnType<typeof selectTilesToSetsCountAction>
> = exercisesMock.map((exercise) => {
  return {
    name: exercise.tile.name,
    count: exercise.sets.length,
  };
});

export const tilesToTagsCount = exercisesMock.reduce<
  Awaited<ReturnType<typeof selectTilesToTagsCount>>
>((tilesToTagsCount, exercise) => {
  const tags = exercise.tile.tileToTags.map((tileToTag) => tileToTag.tag);

  for (const tag of tags) {
    const tagCount = tilesToTagsCount.find((tileToTags) => {
      return tileToTags.name === tag.name;
    });

    if (!tagCount) {
      tilesToTagsCount.push({ name: tag.name, id: tag.id, count: 1 });
    } else {
      tagCount.count += 1;
    }
  }

  return tilesToTagsCount;
}, []);
