import { exerciseRepo } from "@gym-graphs/db/repo/exercise";
import { tagRepo } from "@gym-graphs/db/repo/tag";
import { tileRepo } from "@gym-graphs/db/repo/tile";
import { dbErrorToHttp } from "~/libs/db";
import { ok } from "neverthrow";
import type { Db } from "@gym-graphs/db";
import type { Dashboard, Tag, Tile, TilesToTags } from "@gym-graphs/db/schemas";
import type { CreateExerciseTile } from "@gym-graphs/schemas/tile";

const createExerciseTile = async (
  name: CreateExerciseTile["name"],
  tagIds: CreateExerciseTile["tagIds"],
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  await db.transaction(async (tx) => {
    const exercise = await exerciseRepo
      .create(tx)
      .match((exercise) => exercise, dbErrorToHttp);

    const tile = await tileRepo
      .create(name, dashboardId, tx)
      .match((tile) => tile, dbErrorToHttp);

    if (tagIds?.length) {
      await tagRepo
        .addManyToTile(tile.id, tagIds, tx)
        .match((tags) => tags, dbErrorToHttp);
    }

    await tileRepo
      .addExerciseOverviewTile(exercise.id, tile.id, tx)
      .match((tile) => tile, dbErrorToHttp);
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

  const tiles = await tileRepo
    .selectInfinite(name, tags, dashboardId, page, pageSize, db)
    .andThen((tiles) => {
      return ok(
        tiles.map((tile) => {
          if (tile.exerciseOverview) {
            return {
              type: "exerciseOverview" as const,
              exerciseOverview: tile.exerciseOverview,
              tileToTags: tile.tileToTags,
              id: tile.id,
              name: tile.name,
            };
          }

          if (tile.exerciseSetCount) {
            return {
              type: "exerciseSetCount" as const,
              exerciseSetCount: tile.exerciseSetCount,
              tileToTags: tile.tileToTags,
              id: tile.id,
              name: tile.name,
            };
          }

          if (tile.exerciseTagCount) {
            return {
              type: "exerciseTagCount" as const,
              exerciseTagCount: tile.exerciseTagCount,
              tileToTags: tile.tileToTags,
              id: tile.id,
              name: tile.name,
            };
          }

          if (tile.dashboardHeatMap) {
            return {
              type: "dashboardHeatMap" as const,
              dashboardHeatMap: tile.dashboardHeatMap,
              tileToTags: tile.tileToTags,
              id: tile.id,
              name: tile.name,
            };
          }

          if (tile.dashboardFunFacts) {
            return {
              type: "dashboardFunFacts" as const,
              dashboardFunFacts: tile.dashboardFunFacts,
              tileToTags: tile.tileToTags,
              id: tile.id,
              name: tile.name,
            };
          }

          throw new Error("cannot infer type of tile");
        }),
      );
    })
    .match((tile) => tile, dbErrorToHttp);

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

  return tileRepo
    .reorder(reversedTileIds, dashboardId, db)
    .match((tile) => tile, dbErrorToHttp);
};

const patchById = async (
  input: Parameters<typeof tileRepo.patchById>[0],
  dashboardId: Dashboard["id"],
  tileId: Tile["id"],
  db: Db,
) => {
  return tileRepo
    .patchById(input, dashboardId, tileId, db)
    .match((tile) => tile, dbErrorToHttp);
};

const deleteById = async (
  dashboardId: Dashboard["id"],
  tileId: Tile["id"],
  db: Db,
) => {
  return tileRepo
    .deleteById(dashboardId, tileId, db)
    .match((tile) => tile, dbErrorToHttp);
};

const addTag = async (
  tileId: TilesToTags["tileId"],
  tagId: TilesToTags["tagId"],
  userId: Tag["userId"],
  db: Db,
) => {
  const tile = await tileRepo
    .selectByIdWithTag(tileId, tagId, userId, db)
    .match((tile) => tile, dbErrorToHttp);

  await tagRepo
    .createTileToTags(tileId, tagId, db)
    .match((tileToTags) => tileToTags, dbErrorToHttp);

  return tile;
};

const deleteTag = async (
  tileId: TilesToTags["tileId"],
  tagId: TilesToTags["tagId"],
  userId: Tag["userId"],
  db: Db,
) => {
  return tagRepo
    .deleteTileTagTags(tileId, tagId, userId, db)
    .match((tag) => tag, dbErrorToHttp);
};

export const tileService = {
  createExerciseTile,
  selectInfinite,
  reorder,
  patchById,
  deleteById,
  addTag,
  deleteTag,
};
