import { exerciseRepo } from "@gym-graphs/db/repo/exercise";
import { dbErrorToHttp } from "~/libs/db";
import type { Dashboard, Exercise } from "@gym-graphs/db/schemas";
import type { Db } from "@gym-graphs/db";

const selectById = async (
  userId: Dashboard["userId"],
  exerciseId: Exercise["id"],
  db: Db,
) => {
  return exerciseRepo
    .selectById(userId, exerciseId, db)
    .match((exercise) => exercise, dbErrorToHttp);
};

export const exerciseService = {
  selectById,
};
