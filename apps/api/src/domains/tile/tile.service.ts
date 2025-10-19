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

    await tileRepo.create(name, "exercise", exercise.id, dashboardId, tx);
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

  const showNextPage = tiles.length > pageSize - 1;
  const nextCursor = showNextPage ? page + 1 : null;

  return {
    tiles,
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
