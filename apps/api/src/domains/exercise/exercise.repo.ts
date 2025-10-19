import { exerciseTable } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (db: Db) => {
  const [exercise] = await db.insert(exerciseTable).values({}).returning();

  if (!exercise) {
    throw new Error("exercise returned by db is null");
  }

  return exercise;
};

const createMany = async (
  data: Array<typeof exerciseTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(exerciseTable).values(data).returning();
};

export const exerciseRepo = {
  create,
  createMany,
};
