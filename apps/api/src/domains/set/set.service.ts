import { setRepo } from "~/domains/set/set.repo";
import { exerciseRepo } from "~/domains/exercise/exercise.repo";
import { HTTPException } from "hono/http-exception";
import type { Set, User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const create = async (
  userId: User["id"],
  weightInKg: Set["weightInKg"],
  repetitions: Set["repetitions"],
  exerciseId: Set["exerciseId"],
  db: Db,
) => {
  const exercise = await exerciseRepo.selectById(userId, exerciseId, db);

  if (!exercise) {
    throw new HTTPException(401, { message: "idk" });
  }

  const set = await setRepo.create(weightInKg, repetitions, exerciseId, db);

  return set;

  //TODO:
  // const currentBestSet = getBestSetFromSets(exercise.sets);

  // if (currentBestSet) {
  //   const currentOneRepMaxInKg = calculateOneRepMax(
  //     currentBestSet.repetitions,
  //     currentBestSet.weightInKg,
  //     context.user.oneRepMaxAlgo,
  //   );

  //   const candidateBestOneRepMaxInKg = calculateOneRepMax(
  //     newSet.repetitions,
  //     newSet.weightInKg,
  //     context.user.oneRepMaxAlgo,
  //   );

  //   const newOneRepMax = candidateBestOneRepMaxInKg > currentOneRepMaxInKg;

  //   if (newOneRepMax) {
  //     await notifyTeamsFromNewOneRepMax(
  //       context.user,
  //       exercise.tile.name,
  //       candidateBestOneRepMaxInKg,
  //       context.db,
  //     );
  //   }
  // }
};

const deleteById = async (setId: Set["id"], userId: User["id"], db: Db) => {
  const set = setRepo.deleteById(setId, userId, db);

  if (!set) {
    throw new HTTPException(404, { message: "set not found" });
  }

  return set;
};

export const setService = {
  create,
  deleteById,
};
