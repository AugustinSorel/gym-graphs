import { and, asc, desc, eq } from "drizzle-orm";
import { setTable, exerciseTable, tagTable } from "~/db/db.schemas";
import type { Exercise } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

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
      tile: {
        with: {
          tags: {
            orderBy: asc(tagTable.createdAt),
            with: {
              tag: true,
            },
          },
        },
      },
      sets: {
        orderBy: desc(setTable.createdAt),
      },
    },
  });
};

export const createExercise = async (userId: Exercise["userId"], db: Db) => {
  const [exercise] = await db
    .insert(exerciseTable)
    .values({ userId })
    .returning();

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
