import { and, asc, desc, eq, ilike, inArray, sql, SQL } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { HTTPException } from "hono/http-exception";
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
} from "~/db/db.schemas";
import {
  exerciseOverviewTileTable,
  dashboardHeatMapTileTable,
} from "~/db/db.schemas";
import type {
  Tag,
  Tile,
  ExerciseSetCountTile,
  ExerciseOverviewTile,
  Dashboard,
} from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (
  name: Tile["name"],
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  try {
    const [tile] = await db
      .insert(tileTable)
      .values({ name, dashboardId })
      .returning();

    if (!tile) {
      throw new Error("tile returned by db is null");
    }

    return tile;
  } catch (e) {
    const duplicateTile =
      e instanceof DatabaseError &&
      e.constraint === "tile_name_dashboard_id_unique";

    if (duplicateTile) {
      throw new HTTPException(422, {
        message: "tile name already exists",
        cause: e,
      });
    }

    throw e;
  }
};

export const createMany = async (
  values: Array<typeof tileTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(tileTable).values(values).returning();
};

const selectInfinite = async (
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

  return db.query.tileTable.findMany({
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
  });
};

const reorder = async (
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

  await db
    .update(tileTable)
    .set({ index: finalSql })
    .where(
      and(
        inArray(tileTable.id, tileIds),
        eq(tileTable.dashboardId, dashboardId),
      ),
    );
};

const addTags = async (
  tileId: Tile["id"],
  tagsToAdd: Array<Tag["id"]>,
  db: Db,
) => {
  return db
    .insert(tilesToTagsTableTable)
    .values(tagsToAdd.map((tagId) => ({ tagId, tileId })))
    .returning();
};

const addExercises = async (
  values: Array<typeof exerciseOverviewTileTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(exerciseOverviewTileTable).values(values).returning();
};

const createExercise = async (
  exerciseId: ExerciseOverviewTile["exerciseId"],
  tileId: ExerciseOverviewTile["tileId"],
  db: Db,
) => {
  const exerciseTile = await db
    .insert(exerciseOverviewTileTable)
    .values({ tileId, exerciseId })
    .returning();

  if (!exerciseTile) {
    throw new Error("db did not return exercise tile");
  }

  return exerciseTile;
};

const addExerciseSetCount = async (
  tileId: ExerciseSetCountTile["tileId"],
  db: Db,
) => {
  const [exerciseSetCount] = await db
    .insert(exerciseSetCountTileTable)
    .values({ tileId })
    .returning();

  if (!exerciseSetCount) {
    throw new Error("db did not returned exerciseToSetCounts");
  }

  return exerciseSetCount;
};

const addExerciseTagCount = async (
  tileId: ExerciseSetCountTile["tileId"],
  db: Db,
) => {
  const [exerciseTagCount] = await db
    .insert(exerciseTagCountTileTable)
    .values({ tileId })
    .returning();

  if (!exerciseTagCount) {
    throw new Error("db did not returned exerciTagoTagCounts");
  }

  return exerciseTagCount;
};

const addDashboardHeatMap = async (
  tileId: ExerciseSetCountTile["tileId"],
  db: Db,
) => {
  const [dashboardHeatMap] = await db
    .insert(dashboardHeatMapTileTable)
    .values({ tileId })
    .returning();

  if (!dashboardHeatMap) {
    throw new Error("db did not returned dashboardHeatMap");
  }

  return dashboardHeatMap;
};

const addDashboardFunFacts = async (
  tileId: ExerciseSetCountTile["tileId"],
  db: Db,
) => {
  const [dashboardFunFacts] = await db
    .insert(dashboardFunFactsTileTable)
    .values({ tileId })
    .returning();

  if (!dashboardFunFacts) {
    throw new Error("db did not returned dashboardFunFacts");
  }

  return dashboardFunFacts;
};

const patchById = async (
  input: PgUpdateSetSource<typeof tileTable>,
  dashboardId: Dashboard["id"],
  tileId: Tile["id"],
  db: Db,
) => {
  try {
    const [tile] = await db
      .update(tileTable)
      .set(input)
      .where(
        and(eq(tileTable.id, tileId), eq(tileTable.dashboardId, dashboardId)),
      )
      .returning();

    return tile;
  } catch (e) {
    const duplicateTile =
      e instanceof DatabaseError &&
      e.constraint === "tile_name_dashboard_id_unique";

    if (duplicateTile) {
      throw new HTTPException(422, {
        message: "tile name already exists",
        cause: e,
      });
    }

    throw e;
  }
};

export const tileRepo = {
  create,
  reorder,
  createMany,
  createExercise,
  selectInfinite,
  addTags,
  addExercises,
  addExerciseSetCount,
  addExerciseTagCount,
  addDashboardHeatMap,
  addDashboardFunFacts,
  patchById,
};
