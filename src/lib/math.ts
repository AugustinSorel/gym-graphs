import type { WeightUnit } from "@/context/weightUnit";
import type { ExerciseData } from "@/db/types";

const LBS_CONVERTION = 2.2046244;

export const calculateOneRepMax = (
  weightLifted: ExerciseData["weightLifted"],
  numberOfReps: ExerciseData["numberOfRepetitions"]
) => {
  return +(weightLifted * (1 + numberOfReps / 30)).toFixed(2);
};

export const convertWeightToLbs = (weight: number, unit: WeightUnit) => {
  if (unit === "lbs") {
    return +(weight * LBS_CONVERTION).toFixed(2);
  }

  return weight;
};

export const convertWeightToKg = (weight: number, unit: WeightUnit) => {
  if (unit === "lbs") {
    return +(weight / LBS_CONVERTION).toFixed(2);
  }

  return weight;
};
