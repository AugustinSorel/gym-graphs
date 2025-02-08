import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { dashboardTable, setTable, tagTable, tileTable } from "~/db/db.schemas";
import type { SQL } from "drizzle-orm";
import type { Dashboard, Tile } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import {
  selectUserFavoriteExercise,
  selectUserLeastFavoriteExercise,
  selectUserSetsCount,
  selectUserTotalWeightInKg,
} from "~/user/user.services";

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

export const selectDashboardFunFacts = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  const operations = [
    //TODO: move this to dashboard entity
    selectUserTotalWeightInKg(userId, db),
    selectUserSetsCount(userId, db),
    selectUserFavoriteExercise(userId, db),
    selectUserLeastFavoriteExercise(userId, db),
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
