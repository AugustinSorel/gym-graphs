import { ExerciseSet } from "~/db/db.schemas";

export const getOneRepMaxEplay = (
  weight: ExerciseSet["weightInKg"],
  repetitions: ExerciseSet["repetitions"],
) => {
  if (repetitions <= 0) {
    throw new Error("repetitions must be above 0");
  }

  const oneRepMax = weight * (1 + repetitions / 30);

  return parseInt(oneRepMax.toString());
};
