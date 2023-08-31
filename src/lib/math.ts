import type { ExerciseData } from "@/db/types";

export const getOneRepMax = (
  weightLifted: ExerciseData["weightLifted"],
  numberOfReps: ExerciseData["numberOfRepetitions"]
) => {
  return +(weightLifted * (1 + numberOfReps / 30)).toFixed(2);
};
