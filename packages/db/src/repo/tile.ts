import { and, asc, desc, eq, ilike, inArray, sql, SQL } from "drizzle-orm";
import { DatabaseError } from "pg";
import {
  dashboardFunFactsTileTable,
  dashboardTable,
  exerciseSetCountTileTable,
  exerciseTagCountTileTable,
  setTable,
  tagTable,
  tilesToTagsTableTable,
  tileTable,
  userTable,
} from "~/schemas";
import {
  exerciseOverviewTileTable,
  dashboardHeatMapTileTable,
} from "~/schemas";
import type {
  Tag,
  Tile,
  ExerciseSetCountTile,
  ExerciseOverviewTile,
  Dashboard,
  TilesToTags,
} from "~/schemas";
import { ok, ResultAsync } from "neverthrow";
import { buildError } from "~/error";
import { extractEntityFromRows } from "~/utils";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { Db } from "~/db";

const create = (
  name: Tile["name"],
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(tileTable).values({ name, dashboardId }).returning(),
    (e) => {
      const duplicateTile =
        e instanceof DatabaseError &&
        e.constraint === "tile_name_dashboard_id_unique";

      if (duplicateTile) {
        return buildError("duplicate tile", e);
      }

      return buildError("internal", e);
    },
  ).andThen(extractEntityFromRows);
};

export const createMany = (
  values: Array<typeof tileTable.$inferInsert>,
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(tileTable).values(values).returning(),
    (e) => buildError("internal", e),
  );
};

const selectInfinite = (
  name: Tile["name"],
  tags: Array<Tag["name"]>,
  dashboardId: Tile["dashboardId"],
  page: number,
  pageSize: number,
  db: Db,
) => {
  const tilesIdsFilteredByTags = db
    .select({ id: tileTable.id })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(
      tilesToTagsTableTable,
      eq(tilesToTagsTableTable.tileId, tileTable.id),
    )
    .innerJoin(tagTable, eq(tagTable.id, tilesToTagsTableTable.tagId))
    .where(
      and(eq(dashboardTable.id, dashboardId), inArray(tagTable.name, tags)),
    );

  return ResultAsync.fromPromise(
    db.query.tileTable.findMany({
      where: and(
        eq(tileTable.dashboardId, dashboardId),
        ilike(tileTable.name, `%${name}%`),
        tags.length ? inArray(tileTable.id, tilesIdsFilteredByTags) : undefined,
      ),
      orderBy: desc(tileTable.index),
      limit: pageSize,
      offset: (page - 1) * pageSize,
      with: {
        exerciseOverview: {
          with: {
            exercise: {
              with: {
                sets: {
                  orderBy: desc(setTable.createdAt),
                },
              },
            },
          },
        },
        exerciseSetCount: true,
        exerciseTagCount: true,
        dashboardHeatMap: true,
        dashboardFunFacts: true,
        tileToTags: {
          orderBy: asc(tagTable.createdAt),
          with: {
            tag: true,
          },
        },
      },
    }),
    (e) => buildError("internal", e),
  );
};

const reorder = (
  tileIds: Array<Tile["id"]>,
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  const sqlChunks: Array<SQL> = [];

  sqlChunks.push(sql`(case`);

  tileIds.forEach((tileId, i) => {
    sqlChunks.push(
      sql`when ${tileTable.id} = ${tileId} then cast(${i} as integer)`,
    );
  });

  sqlChunks.push(sql`end)`);

  const finalSql = sql.join(sqlChunks, sql.raw(" "));

  return ResultAsync.fromPromise(
    db
      .update(tileTable)
      .set({ index: finalSql })
      .where(
        and(
          inArray(tileTable.id, tileIds),
          eq(tileTable.dashboardId, dashboardId),
        ),
      )
      .returning(),
    (e) => buildError("internal", e),
  );
};

const addExerciseOverviewTiles = (
  values: Array<typeof exerciseOverviewTileTable.$inferInsert>,
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(exerciseOverviewTileTable).values(values).returning(),
    (e) => buildError("internal", e),
  );
};

const addExerciseOverviewTile = (
  exerciseId: ExerciseOverviewTile["exerciseId"],
  tileId: ExerciseOverviewTile["tileId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db
      .insert(exerciseOverviewTileTable)
      .values({ tileId, exerciseId })
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const addExerciseSetCount = (
  tileId: ExerciseSetCountTile["tileId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(exerciseSetCountTileTable).values({ tileId }).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const addExerciseTagCount = (
  tileId: ExerciseSetCountTile["tileId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(exerciseTagCountTileTable).values({ tileId }).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const addDashboardHeatMap = (
  tileId: ExerciseSetCountTile["tileId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(dashboardHeatMapTileTable).values({ tileId }).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const addDashboardFunFacts = (
  tileId: ExerciseSetCountTile["tileId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(dashboardFunFactsTileTable).values({ tileId }).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const patchById = (
  input: PgUpdateSetSource<typeof tileTable>,
  dashboardId: Dashboard["id"],
  tileId: Tile["id"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db
      .update(tileTable)
      .set(input)
      .where(
        and(eq(tileTable.id, tileId), eq(tileTable.dashboardId, dashboardId)),
      )
      .returning(),
    (e) => {
      const duplicateTile =
        e instanceof DatabaseError &&
        e.constraint === "tile_name_dashboard_id_unique";

      if (duplicateTile) {
        return buildError("duplicate tile", e);
      }

      return buildError("internal", e);
    },
  ).andThen(extractEntityFromRows);
};

const deleteById = (
  dashboardId: Dashboard["id"],
  tileId: Tile["id"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db
      .delete(tileTable)
      .where(
        and(eq(tileTable.dashboardId, dashboardId), eq(tileTable.id, tileId)),
      )
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(() => ok(null));
};

const selectByIdWithTag = (
  tileId: TilesToTags["tileId"],
  tagId: TilesToTags["tagId"],
  userId: Tag["userId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db
      .select()
      .from(tileTable)
      .innerJoin(dashboardTable, eq(dashboardTable.id, tileTable.dashboardId))
      .innerJoin(userTable, eq(dashboardTable.userId, userId))
      .innerJoin(
        tagTable,
        and(eq(tagTable.userId, userId), eq(tagTable.id, tagId)),
      )
      .where(eq(tileTable.id, tileId)),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

export const tileRepo = {
  create,
  reorder,
  createMany,
  addExerciseOverviewTiles,
  addExerciseOverviewTile,
  selectInfinite,
  addExerciseSetCount,
  addExerciseTagCount,
  addDashboardHeatMap,
  addDashboardFunFacts,
  patchById,
  deleteById,
  selectByIdWithTag,
};
