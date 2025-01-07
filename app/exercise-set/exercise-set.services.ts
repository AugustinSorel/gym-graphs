import { exerciseSetTable } from "~/db/db.schemas";
import { Db } from "~/utils/db";

export const createExerciseSet = async (
  set: typeof exerciseSetTable.$inferInsert,
  db: Db,
) => {
  return db.insert(exerciseSetTable).values(set);
};

export const createExerciseSets = async (
  set: Array<typeof exerciseSetTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(exerciseSetTable).values(set);
};
