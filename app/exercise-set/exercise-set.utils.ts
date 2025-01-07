import { ExerciseSet } from "~/db/db.schemas";

export const getOneRepMaxEplay = (
  weightInKg: ExerciseSet["weightInKg"],
  repetitions: ExerciseSet["repetitions"],
) => {
  if (repetitions <= 0) {
    throw new Error("repetitions must be above 0");
  }

  const oneRepMax = weightInKg * (1 + repetitions / 30);

  return parseInt(oneRepMax.toFixed(2));
};
