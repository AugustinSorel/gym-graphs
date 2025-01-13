import { eq, and, exists } from "drizzle-orm";
import { Set, setTable, exerciseTable, User } from "~/db/db.schemas";
import { Db } from "~/utils/db";

export const createSet = async (
  weightInKg: Set["weightInKg"],
  repetitions: Set["repetitions"],
  exerciseId: Set["exerciseId"],
  db: Db,
) => {
  return db.insert(setTable).values({ weightInKg, repetitions, exerciseId });
};

export const createSets = async (
  set: Array<typeof setTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(setTable).values(set);
};

export const updateSetWeight = async (
  setId: Set["id"],
  userId: User["id"],
  weightInKg: Set["weightInKg"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(setTable)
    .where(eq(setTable.id, setId))
    .innerJoin(
      exerciseTable,
      and(
        eq(exerciseTable.id, setTable.exerciseId),
        eq(exerciseTable.userId, userId),
      ),
    );

  const updatedSets = await db
    .update(setTable)
    .set({
      weightInKg,
      updatedAt: new Date(),
    })
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  if (!updatedSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedSets;
};

export const updateSetRepetitions = async (
  setId: Set["id"],
  userId: User["id"],
  repetitions: Set["repetitions"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(setTable)
    .where(eq(setTable.id, setId))
    .innerJoin(
      exerciseTable,
      and(
        eq(exerciseTable.id, setTable.exerciseId),
        eq(exerciseTable.userId, userId),
      ),
    );

  const updatedExerciseSets = await db
    .update(setTable)
    .set({
      repetitions,
      updatedAt: new Date(),
    })
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  if (!updatedExerciseSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedExerciseSets;
};

export const updateSetDoneAt = async (
  setId: Set["id"],
  userId: User["id"],
  doneAt: Set["doneAt"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(setTable)
    .where(eq(setTable.id, setId))
    .innerJoin(
      exerciseTable,
      and(
        eq(exerciseTable.id, setTable.exerciseId),
        eq(exerciseTable.userId, userId),
      ),
    );

  const updatedExerciseSets = await db
    .update(setTable)
    .set({
      doneAt,
      updatedAt: new Date(),
    })
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  if (!updatedExerciseSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedExerciseSets;
};

export const deleteSet = async (
  setId: Set["id"],
  userId: User["id"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(setTable)
    .where(eq(setTable.id, setId))
    .innerJoin(
      exerciseTable,
      and(
        eq(exerciseTable.id, setTable.exerciseId),
        eq(exerciseTable.userId, userId),
      ),
    );

  const updatedExerciseSets = await db
    .delete(setTable)
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  if (!updatedExerciseSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedExerciseSets;
};
