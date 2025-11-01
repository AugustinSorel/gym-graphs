import { and, asc, eq, exists } from "drizzle-orm";
import {
  dashboardTable,
  exerciseTable,
  setTable,
  tagTable,
  tileTable,
} from "~/schemas";
import { err, ok, ResultAsync } from "neverthrow";
import { buildError } from "~/error";
import { extractEntityFromRows } from "~/utils";
import type { Db } from "~/db";
import type { Dashboard, Exercise } from "~/schemas";

const create = (db: Db) => {
  return ResultAsync.fromPromise(
    db.insert(exerciseTable).values({}).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const selectById = (
  userId: Dashboard["userId"],
  exerciseId: Exercise["id"],
  db: Db,
) => {
  const userExercise = db
    .select()
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, exerciseId))
    .where(eq(dashboardTable.userId, userId));

  return ResultAsync.fromPromise(
    db.query.exerciseTable.findFirst({
      where: and(eq(exerciseTable.id, exerciseId), exists(userExercise)),
      with: {
        exerciseOverviewTile: {
          with: {
            tile: {
              with: {
                tileToTags: {
                  orderBy: asc(tagTable.createdAt),
                  with: {
                    tag: true,
                  },
                },
              },
            },
          },
        },

        sets: {
          orderBy: asc(setTable.doneAt),
        },
      },
    }),
    (e) => buildError("internal", e),
  ).andThen((exercise) => {
    if (!exercise) {
      return err(buildError("exercise not found"));
    }

    return ok(exercise);
  });
};

const createMany = (data: Array<typeof exerciseTable.$inferInsert>, db: Db) => {
  return ResultAsync.fromPromise(
    db.insert(exerciseTable).values(data).returning(),
    (e) => buildError("internal", e),
  );
};

export const exerciseRepo = {
  create,
  createMany,
  selectById,
};
