import { setTable } from "~/db/db.schemas";
import type { Set } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (
  weightInKg: Set["weightInKg"],
  repetitions: Set["repetitions"],
  exerciseId: Set["exerciseId"],
  db: Db,
) => {
  const [set] = await db
    .insert(setTable)
    .values({ weightInKg, repetitions, exerciseId })
    .returning();

  if (!set) {
    throw new Error("set not returned by db");
  }

  return set;
};

const createMany = async (set: Array<typeof setTable.$inferInsert>, db: Db) => {
  return db.insert(setTable).values(set);
};

export const setRepo = {
  create,
  createMany,
};
