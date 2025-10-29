import { and, eq, exists } from "drizzle-orm";
import {
  dashboardTable,
  exerciseTable,
  setTable,
  tileTable,
  exerciseOverviewTileTable,
} from "~/db/db.schemas";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { Set, User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (
  weightInKg: Set["weightInKg"],
  repetitions: Set["repetitions"],
  exerciseId: Set["exerciseId"],
  db: Db,
) => {
  const [set] = await db
    .insert(setTable)
    .values({ weightInKg, repetitions, exerciseId })
    .returning();

  if (!set) {
    throw new Error("set not returned by db");
  }

  return set;
};

const createMany = async (set: Array<typeof setTable.$inferInsert>, db: Db) => {
  return db.insert(setTable).values(set);
};

const deleteById = async (setId: Set["id"], userId: User["id"], db: Db) => {
  const exercise = db
    .select()
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(
      exerciseOverviewTileTable,
      eq(exerciseOverviewTileTable.tileId, tileTable.id),
    )
    .innerJoin(
      exerciseTable,
      eq(exerciseTable.id, exerciseOverviewTileTable.exerciseId),
    )
    .innerJoin(setTable, eq(setTable.id, setId))
    .where(eq(dashboardTable.userId, userId));

  const [set] = await db
    .delete(setTable)
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  return set;
};

const patchById = async (
  input: PgUpdateSetSource<typeof setTable>,
  setId: Set["id"],
  userId: User["id"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(
      exerciseOverviewTileTable,
      eq(exerciseOverviewTileTable.tileId, tileTable.id),
    )
    .innerJoin(
      exerciseTable,
      eq(exerciseTable.id, exerciseOverviewTileTable.exerciseId),
    )
    .innerJoin(setTable, eq(setTable.id, setId))
    .where(eq(dashboardTable.userId, userId));

  const [set] = await db
    .update(setTable)
    .set(input)
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  return set;
};

export const setRepo = {
  create,
  createMany,
  deleteById,
  patchById,
};
