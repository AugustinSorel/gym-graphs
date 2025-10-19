import { exerciseTable } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (db: Db) => {
  const [exercise] = await db.insert(exerciseTable).values({}).returning();

  if (!exercise) {
    throw new Error("exercise returned by db is null");
  }

  return exercise;
};

export const exerciseRepo = {
  create,
};
