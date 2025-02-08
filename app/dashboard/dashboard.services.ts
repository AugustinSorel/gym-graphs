import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  dashboardTable,
  exerciseTable,
  setTable,
  tagTable,
  tileTable,
} from "~/db/db.schemas";
import type { SQL } from "drizzle-orm";
import type { Dashboard, Tile } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const selectTiles = async (
  dashboardId: Tile["dashboardId"],
  page: number,
  pageSize: number,
  db: Db,
) => {
  return db.query.tileTable.findMany({
    where: eq(tileTable.dashboardId, dashboardId),
    orderBy: desc(tileTable.index),
    limit: pageSize,
    offset: (page - 1) * pageSize,
    with: {
      exercise: {
        with: {
          sets: {
            orderBy: desc(setTable.createdAt),
          },
          tags: {
            orderBy: asc(tagTable.createdAt),
            with: {
              tag: true,
            },
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
    throw new Error("dashboard returned by db is null");
  }

  return dashboard;
};

export const createTiles = async (
  values: Array<typeof tileTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(tileTable).values(values);
};

export const createTile = async (
  type: Tile["type"],
  exerciseId: Tile["exerciseId"],
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  return db.insert(tileTable).values({ type, dashboardId, exerciseId });
};

export const selectDashboardTotalWeightInkg = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  const [res] = await db
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

  if (!res) {
    throw new Error("total weight in kg returned by db is null");
  }

  return res;
};

export const selectDashboardSetsCount = async (
  userId: Dashboard["id"],
  db: Db,
) => {
  const [setsCount] = await db
    .select({
      count: count(setTable.id).mapWith(Number),
    })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(dashboardTable.userId, userId));

  if (!setsCount) {
    throw new Error("sets count returned by db is null");
  }

  return setsCount;
};

export const selectDashboardFavoriteExercise = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  const [favoriteExercise] = await db
    .select({
      name: exerciseTable.name,
      setsCount: count(setTable.id).mapWith(Number),
    })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(dashboardTable.userId, userId))
    .groupBy(exerciseTable.id)
    .orderBy(desc(sql`count`))
    .limit(1);

  if (!favoriteExercise) {
    throw new Error("favorite exercise returned by db is null");
  }

  return favoriteExercise;
};

export const selectDashboardLeastFavoriteExercise = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  const [leastFavoriteExercise] = await db
    .select({
      name: exerciseTable.name,
      setsCount: count(setTable.id).mapWith(Number),
    })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(dashboardTable.userId, userId))
    .groupBy(exerciseTable.id)
    .orderBy(asc(sql`count`))
    .limit(1);

  if (!leastFavoriteExercise) {
    throw new Error("least favorite exercise returned by db is null");
  }

  return leastFavoriteExercise;
};

export const selectDashboardFunFacts = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  const operations = [
    selectDashboardTotalWeightInkg(userId, db),
    selectDashboardSetsCount(userId, db),
    selectDashboardFavoriteExercise(userId, db),
    selectDashboardLeastFavoriteExercise(userId, db),
  ] as const;

  const [totalWeightInKg, setsCount, favoriteExercise, leastFavoriteExercise] =
    await Promise.all(operations);

  return {
    totalWeightInKg: totalWeightInKg.total,
    setsCount: setsCount.count,
    favoriteExercise: {
      name: favoriteExercise.name,
    },
    leastFavoriteExercise: {
      name: leastFavoriteExercise.name,
    },
  };
};
