import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  sql,
  sum,
} from "drizzle-orm";
import {
  dashboardTable,
  exerciseTable,
  setTable,
  tagTable,
  tileTable,
  tilesToTagsTableTable,
} from "~/db/db.schemas";
import {
  DashboardNotFoundError,
  TileDuplcateError,
  TileNotFoundError,
} from "~/dashboard/dashboard.errors";
import type { SQL } from "drizzle-orm";
import type { Dashboard, Tag, Tile } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const selectTiles = async (
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
      tileToTags: {
        orderBy: asc(tagTable.createdAt),
        with: {
          tag: true,
        },
      },
      exercise: {
        with: {
          sets: {
            orderBy: desc(setTable.createdAt),
          },
        },
      },
    },
  });
};

export const reorderTiles = async (
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

export const createDashboard = async (userId: Dashboard["userId"], db: Db) => {
  const [dashboard] = await db
    .insert(dashboardTable)
    .values({ userId })
    .returning();

  if (!dashboard) {
    throw new DashboardNotFoundError();
  }

  return dashboard;
};

export const createTiles = async (
  values: Array<typeof tileTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(tileTable).values(values).returning();
};

export const createTile = async (
  name: Tile["name"],
  type: Tile["type"],
  exerciseId: Tile["exerciseId"],
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  try {
    const [tile] = await db
      .insert(tileTable)
      .values({ name, type, dashboardId, exerciseId })
      .returning();

    if (!tile) {
      throw new TileNotFoundError();
    }

    return tile;
  } catch (e) {
    if (TileDuplcateError.check(e)) {
      throw new TileDuplcateError();
    }

    throw e;
  }
};

export const selectTilesTotalWeightInKg = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  const [totalWeightInKg] = await db
    .select({
      total: sql`sum(${setTable.weightInKg} * ${setTable.repetitions})`.mapWith(
        Number,
      ),
    })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(dashboardTable.userId, userId));

  if (!totalWeightInKg) {
    return 0;
  }

  return totalWeightInKg.total;
};

export const selectTilesTotalRepetitions = async (
  userId: Dashboard["id"],
  db: Db,
) => {
  const [repetitionsCount] = await db
    .select({
      count: sum(setTable.repetitions).mapWith(Number),
    })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(dashboardTable.userId, userId));

  if (!repetitionsCount) {
    return 0;
  }

  return repetitionsCount.count;
};

export const selectTileWithMostSets = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  const [favoriteExercise] = await db
    .select({
      name: tileTable.name,
      setsCount: count(setTable.id).mapWith(Number),
    })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(dashboardTable.userId, userId))
    .groupBy(tileTable.name)
    .orderBy(desc(sql`count`))
    .limit(1);

  if (!favoriteExercise) {
    return {
      name: "unknown",
      setsCount: 0,
    };
  }

  return favoriteExercise;
};

export const selectTileWithLeastSets = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  const [leastFavoriteExercise] = await db
    .select({
      name: tileTable.name,
      setsCount: count(setTable.id).mapWith(Number),
    })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(dashboardTable.userId, userId))
    .groupBy(tileTable.name)
    .orderBy(asc(sql`count`))
    .limit(1);

  if (!leastFavoriteExercise) {
    return {
      name: "unknown",
      setsCount: 0,
    };
  }

  return leastFavoriteExercise;
};

export const selectTilesFunFacts = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  const operations = [
    selectTilesTotalWeightInKg(userId, db),
    selectTilesTotalRepetitions(userId, db),
    selectTileWithMostSets(userId, db),
    selectTileWithLeastSets(userId, db),
  ] as const;

  const [
    totalWeightInKg,
    totalRepetitions,
    tileWithMostSets,
    tileWithLeastSets,
  ] = await Promise.all(operations);

  return {
    totalWeightInKg,
    totalRepetitions,
    tileWithMostSets,
    tileWithLeastSets,
  };
};

export const renameTile = async (
  dashboardId: Dashboard["id"],
  tileId: Tile["id"],
  name: Tile["name"],
  db: Db,
) => {
  try {
    const [tile] = await db
      .update(tileTable)
      .set({ name })
      .where(
        and(eq(tileTable.id, tileId), eq(tileTable.dashboardId, dashboardId)),
      )
      .returning();

    if (!tile) {
      throw new TileNotFoundError();
    }

    return tile;
  } catch (e) {
    if (TileDuplcateError.check(e)) {
      throw new TileDuplcateError();
    }

    throw e;
  }
};

export const deleteTile = async (
  dashboardId: Dashboard["id"],
  tileId: Tile["id"],
  db: Db,
) => {
  const [tile] = await db
    .delete(tileTable)
    .where(
      and(eq(tileTable.dashboardId, dashboardId), eq(tileTable.id, tileId)),
    )
    .returning();

  if (!tile) {
    throw new TileNotFoundError();
  }

  return tile;
};

export const selectTilesToSetsCount = async (
  dashboardId: Dashboard["id"],
  db: Db,
) => {
  return db
    .select({
      name: tileTable.name,
      count: count(tileTable.name),
    })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(dashboardTable.id, dashboardId))
    .groupBy(tileTable.name);
};

export const selectTilesToTagsCount = async (userId: Tag["userId"], db: Db) => {
  return db
    .select({
      count: count(exerciseTable.id),
      id: tagTable.id,
      name: tagTable.name,
    })
    .from(tagTable)
    .leftJoin(
      tilesToTagsTableTable,
      eq(tilesToTagsTableTable.tagId, tagTable.id),
    )
    .leftJoin(tileTable, eq(tileTable.id, tilesToTagsTableTable.tileId))
    .leftJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .where(eq(tagTable.userId, userId))
    .groupBy(tagTable.id);
};
