import { exerciseRepo } from "~/domains/exercise/exercise.repo";
import { tileRepo } from "./tile.repo";
import type { Db } from "~/libs/db";
import type { Tag, Tile } from "~/db/db.schemas";

const createExerciseTile = async (
  name: Tile["name"],
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  await db.transaction(async (tx) => {
    const exercise = await exerciseRepo.create(tx);

    const tile = await tileRepo.create(name, dashboardId, tx);

    await tileRepo.createExercise(exercise.id, tile.id, tx);
  });
};

const selectInfinite = async (
  name: Tile["name"],
  tags: Array<Tag["name"]>,
  page: number,
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  const pageSize = 100;

  const tiles = await tileRepo.selectInfinite(
    name,
    tags,
    dashboardId,
    page,
    pageSize,
    db,
  );

  const tiles2 = tiles.map((tile) => {
    if (tile.exerciseOverview) {
      return {
        ...tile,
        type: "exerciseOverview" as const,
        exerciseOverview: tile.exerciseOverview,
      };
    }

    if (tile.exerciseSetCount) {
      return {
        ...tile,
        type: "exerciseSetCount" as const,
        exerciseSetCount: tile.exerciseSetCount,
      };
    }

    if (tile.exerciseTagCount) {
      return {
        ...tile,
        type: "exerciseTagCount" as const,
        exerciseTagCount: tile.exerciseTagCount,
      };
    }

    if (tile.dashboardHeatMap) {
      return {
        ...tile,
        type: "dashboardHeatMap" as const,
        dashboardHeatMap: tile.dashboardHeatMap,
      };
    }

    if (tile.dashboardFunFacts) {
      return {
        ...tile,
        type: "dashboardFunFacts" as const,
        dashboardFunFacts: tile.dashboardFunFacts,
      };
    }

    console.log(tile);
    throw new Error("??");
  });

  const showNextPage = tiles2.length > pageSize - 1;
  const nextCursor = showNextPage ? page + 1 : null;

  return {
    tiles: tiles2,
    nextCursor,
  };
};

const reorder = async (
  tileIds: Array<Tile["id"]>,
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  const reversedTileIds = tileIds.toReversed();

  return tileRepo.reorder(reversedTileIds, dashboardId, db);
};

export const tileService = {
  createExerciseTile,
  selectInfinite,
  reorder,
};
