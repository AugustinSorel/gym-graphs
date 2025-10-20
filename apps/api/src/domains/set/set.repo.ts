import { setTable } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const createMany = async (set: Array<typeof setTable.$inferInsert>, db: Db) => {
  return db.insert(setTable).values(set);
};

export const setRepo = {
  createMany,
};
