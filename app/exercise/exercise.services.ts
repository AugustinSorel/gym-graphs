import { and, asc, desc, eq } from "drizzle-orm";
import { setTable, exerciseTable, tagTable } from "~/db/db.schemas";
import type { Exercise, User } from "~/db/db.schemas";
import type { Db } from "~/libs/db.lib";

export const selectDashboardExercises = async (userId: User["id"], db: Db) => {
  return db.query.exerciseTable.findMany({
    where: eq(exerciseTable.userId, userId),
    orderBy: desc(exerciseTable.createdAt),
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
        orderBy: desc(setTable.createdAt),
      },
      tags: {
        orderBy: asc(tagTable.createdAt),
        with: {
          tag: true,
        },
      },
    },
  });
};

export const createExercise = async (
  name: Exercise["name"],
  userId: Exercise["userId"],
  db: Db,
) => {
  const [exercise] = await db
    .insert(exerciseTable)
    .values({ name, userId })
    .returning();

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
    .set({ name, updatedAt: new Date() })
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
