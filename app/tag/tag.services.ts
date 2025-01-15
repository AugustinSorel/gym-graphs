import { and, eq, exists, inArray } from "drizzle-orm";
import { exerciseTable, exerciseTagTable, tagTable } from "~/db/db.schemas";
import type { Exercise, Tag } from "~/db/db.schemas";
import type { Db } from "~/utils/db";

export const selectExerciseTags = async (
  userId: Exercise["userId"],
  exerciseId: Exercise["id"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(exerciseTable)
    .where(
      and(eq(exerciseTable.userId, userId), eq(exerciseTable.id, exerciseId)),
    );

  return db.query.exerciseTagTable.findMany({
    where: and(eq(exerciseTagTable.exerciseId, exerciseId), exists(exercise)),
  });
};

export const createTag = (name: Tag["name"], userId: Tag["userId"], db: Db) => {
  return db.insert(tagTable).values({ name, userId });
};

export const createTags = async (
  data: Array<typeof tagTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(tagTable).values(data).returning();
};

export const deleteTag = async (
  tagId: Tag["id"],
  userId: Tag["userId"],
  db: Db,
) => {
  return db
    .delete(tagTable)
    .where(and(eq(tagTable.id, tagId), eq(tagTable.userId, userId)));
};

export const addExerciseTags = async (
  userId: Exercise["userId"],
  exerciseId: Exercise["id"],
  tagsToAdd: Array<Tag["id"]>,
  db: Db,
) => {
  if (!tagsToAdd.length) {
    return;
  }

  const exercise = await db.query.exerciseTable.findFirst({
    where: and(
      eq(exerciseTable.userId, userId),
      eq(exerciseTable.id, exerciseId),
    ),
  });

  if (!exercise) {
    return;
  }

  await db
    .insert(exerciseTagTable)
    .values(tagsToAdd.map((tagId) => ({ tagId, exerciseId })));
};

export const deleteExerciseTags = async (
  userId: Exercise["userId"],
  exerciseId: Exercise["id"],
  tagsToDelete: Array<Tag["id"]>,
  db: Db,
) => {
  if (!tagsToDelete.length) {
    return;
  }

  const exercise = db
    .select()
    .from(exerciseTable)
    .where(
      and(eq(exerciseTable.userId, userId), eq(exerciseTable.id, exerciseId)),
    );

  await db
    .delete(exerciseTagTable)
    .where(
      and(
        eq(exerciseTagTable.exerciseId, exerciseId),
        inArray(exerciseTagTable.tagId, tagsToDelete),
        exists(exercise),
      ),
    );
};
