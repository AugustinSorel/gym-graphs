import { and, desc, eq } from "drizzle-orm";
import type { Db } from "~/features/utils/db";
import { Exercise, exerciseTable, User } from "~/features/db/db.schemas";

export const selectDashboardExercises = async (userId: User["id"], db: Db) => {
  return db.query.exerciseTable.findMany({
    where: eq(exerciseTable.userId, userId),
    orderBy: desc(exerciseTable.createdAt),
  });
};

export const selectExercise = async (
  userId: Exercise["userId"],
  exerciseName: Exercise["name"],
  db: Db,
) => {
  return db.query.exerciseTable.findFirst({
    where: and(
      eq(exerciseTable.userId, userId),
      eq(exerciseTable.name, exerciseName),
    ),
  });
};

export const createExercise = async (
  data: typeof exerciseTable.$inferInsert,
  db: Db,
) => {
  const [exercise] = await db.insert(exerciseTable).values(data).returning();

  if (!exercise) {
    throw new Error("exercise returned by db is null");
  }

  return exercise;
};

export const createExercises = async (
  data: Array<typeof exerciseTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(exerciseTable).values(data).returning();
};
