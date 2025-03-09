import { and, asc, eq, exists } from "drizzle-orm";
import {
  setTable,
  exerciseTable,
  tagTable,
  dashboardTable,
  tileTable,
} from "~/db/db.schemas";
import { ExerciseNotFoundError } from "./exercise.errors";
import type { Dashboard, Exercise } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const selectExercise = async (
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

  return db.query.exerciseTable.findFirst({
    where: and(eq(exerciseTable.id, exerciseId), exists(userExercise)),
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
      sets: {
        orderBy: asc(setTable.doneAt),
      },
    },
  });
};

export const createExercise = async (db: Db) => {
  const [exercise] = await db.insert(exerciseTable).values({}).returning();

  if (!exercise) {
    throw new ExerciseNotFoundError();
  }

  return exercise;
};

export const createExercises = async (
  data: Array<typeof exerciseTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(exerciseTable).values(data).returning();
};
