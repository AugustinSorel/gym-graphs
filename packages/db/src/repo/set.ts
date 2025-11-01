import { and, eq, exists } from "drizzle-orm";
import {
  dashboardTable,
  exerciseTable,
  setTable,
  tileTable,
  exerciseOverviewTileTable,
} from "~/schemas";
import { ok, ResultAsync } from "neverthrow";
import { buildError } from "~/error";
import { extractEntityFromRows } from "~/utils";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { Set, User } from "~/schemas";
import type { Db } from "~/db";

const create = (
  weightInKg: Set["weightInKg"],
  repetitions: Set["repetitions"],
  exerciseId: Set["exerciseId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db
      .insert(setTable)
      .values({ weightInKg, repetitions, exerciseId })
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const createMany = (set: Array<typeof setTable.$inferInsert>, db: Db) => {
  return ResultAsync.fromPromise(db.insert(setTable).values(set), (e) =>
    buildError("internal", e),
  );
};

const deleteById = (setId: Set["id"], userId: User["id"], db: Db) => {
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

  return ResultAsync.fromPromise(
    db
      .delete(setTable)
      .where(and(eq(setTable.id, setId), exists(exercise)))
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(() => ok(null));
};

const patchById = (
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

  return ResultAsync.fromPromise(
    db
      .update(setTable)
      .set(input)
      .where(and(eq(setTable.id, setId), exists(exercise)))
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

export const setRepo = {
  create,
  createMany,
  deleteById,
  patchById,
};
