import { setRepo } from "@gym-graphs/db/repo/set";
import { exerciseRepo } from "@gym-graphs/db/repo/exercise";
import { dbErrorToHttp } from "~/libs/db";
import type { Set, User } from "@gym-graphs/db/schemas";
import type { Db } from "@gym-graphs/db";

export const create = async (
  userId: User["id"],
  weightInKg: Set["weightInKg"],
  repetitions: Set["repetitions"],
  exerciseId: Set["exerciseId"],
  db: Db,
) => {
  await exerciseRepo
    .selectById(userId, exerciseId, db)
    .match((exercise) => exercise, dbErrorToHttp);

  const set = await setRepo
    .create(weightInKg, repetitions, exerciseId, db)
    .match((set) => set, dbErrorToHttp);

  return set;
};

const deleteById = async (setId: Set["id"], userId: User["id"], db: Db) => {
  return setRepo
    .deleteById(setId, userId, db)
    .match((set) => set, dbErrorToHttp);
};

const patchById = async (
  input: Parameters<typeof setRepo.patchById>[0],
  setId: Set["id"],
  userId: User["id"],
  db: Db,
) => {
  return setRepo
    .patchById(input, setId, userId, db)
    .match((set) => set, dbErrorToHttp);
};

export const setService = {
  create,
  deleteById,
  patchById,
};
