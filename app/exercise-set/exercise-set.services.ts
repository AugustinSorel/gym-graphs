import { eq, and, exists } from "drizzle-orm";
import {
  ExerciseSet,
  exerciseSetTable,
  exerciseTable,
  User,
} from "~/db/db.schemas";
import { Db } from "~/utils/db";

export const createExerciseSet = async (
  set: typeof exerciseSetTable.$inferInsert,
  db: Db,
) => {
  return db.insert(exerciseSetTable).values(set);
};

export const createExerciseSets = async (
  set: Array<typeof exerciseSetTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(exerciseSetTable).values(set);
};

export const updateExerciseSetWeight = async (
  exerciseSetId: ExerciseSet["id"],
  userId: User["id"],
  weightInKg: ExerciseSet["weightInKg"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(exerciseSetTable)
    .where(eq(exerciseSetTable.id, exerciseSetId))
    .innerJoin(
      exerciseTable,
      and(
        eq(exerciseTable.id, exerciseSetTable.exerciseId),
        eq(exerciseTable.userId, userId),
      ),
    );

  const updatedExerciseSets = await db
    .update(exerciseSetTable)
    .set({
      weightInKg,
      updatedAt: new Date(),
    })
    .where(and(eq(exerciseSetTable.id, exerciseSetId), exists(exercise)))
    .returning();

  if (!updatedExerciseSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedExerciseSets;
};

export const updateExerciseSetRepetitions = async (
  exerciseSetId: ExerciseSet["id"],
  userId: User["id"],
  repetitions: ExerciseSet["repetitions"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(exerciseSetTable)
    .where(eq(exerciseSetTable.id, exerciseSetId))
    .innerJoin(
      exerciseTable,
      and(
        eq(exerciseTable.id, exerciseSetTable.exerciseId),
        eq(exerciseTable.userId, userId),
      ),
    );

  const updatedExerciseSets = await db
    .update(exerciseSetTable)
    .set({
      repetitions,
      updatedAt: new Date(),
    })
    .where(and(eq(exerciseSetTable.id, exerciseSetId), exists(exercise)))
    .returning();

  if (!updatedExerciseSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedExerciseSets;
};
