import { HTTPException } from "hono/http-exception";
import { exerciseRepo } from "./exercise.repo";
import type { Dashboard, Exercise } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const selectById = async (
  userId: Dashboard["userId"],
  exerciseId: Exercise["id"],
  db: Db,
) => {
  const exercise = await exerciseRepo.selectById(userId, exerciseId, db);

  if (!exercise) {
    throw new HTTPException(404, { message: "exercise not found" });
  }

  return exercise;
};

export const exerciseService = {
  selectById,
};
