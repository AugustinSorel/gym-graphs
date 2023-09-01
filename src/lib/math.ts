import type { ExerciseData } from "@/db/types";

export const calculateOneRepMax = (
  weightLifted: ExerciseData["weightLifted"],
  numberOfReps: ExerciseData["numberOfRepetitions"]
) => {
  return +(weightLifted * (1 + numberOfReps / 30)).toFixed(2);
};
