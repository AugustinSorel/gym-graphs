import { and, desc, eq } from "drizzle-orm";
import type { Db } from "~/utils/db";
import {
  Exercise,
  exerciseSetTable,
  exerciseTable,
  User,
} from "~/db/db.schemas";

export const selectDashboardExercises = async (userId: User["id"], db: Db) => {
  return db.query.exerciseTable.findMany({
    where: eq(exerciseTable.userId, userId),
    orderBy: desc(exerciseTable.createdAt),
    with: {
      sets: {
        orderBy: desc(exerciseSetTable.createdAt),
      },
    },
  });
};

export const selectExercise = async (
  userId: Exercise["userId"],
  exerciseId: Exercise["id"],
  db: Db,
) => {
  return db.query.exerciseTable.findFirst({
    where: and(
      eq(exerciseTable.userId, userId),
      eq(exerciseTable.id, exerciseId),
    ),
    with: {
      sets: {
        orderBy: desc(exerciseSetTable.createdAt),
      },
    },
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

export const renameExercise = async (
  userId: Exercise["userId"],
  exerciseId: Exercise["id"],
  name: Exercise["name"],
  db: Db,
) => {
  return db
    .update(exerciseTable)
    .set({ name })
    .where(
      and(eq(exerciseTable.id, exerciseId), eq(exerciseTable.userId, userId)),
    );
};

export const deleteExercise = async (
  userId: Exercise["userId"],
  exerciseId: Exercise["id"],
  db: Db,
) => {
  return db
    .delete(exerciseTable)
    .where(
      and(eq(exerciseTable.userId, userId), eq(exerciseTable.id, exerciseId)),
    );
};

export const createExercises = async (
  data: Array<typeof exerciseTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(exerciseTable).values(data).returning();
};
