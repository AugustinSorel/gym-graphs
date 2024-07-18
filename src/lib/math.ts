import type { WeightUnit } from "@/context/weightUnit";
import type { ExerciseData, ExerciseWithData } from "@/server/db/types";

const LBS_CONVERTION = 2.2046244;

export const calculateOneRepMax = (
  weightLifted: ExerciseData["weightLifted"],
  numberOfReps: ExerciseData["numberOfRepetitions"],
) => {
  return +(weightLifted * (1 + numberOfReps / 30)).toFixed(2);
};

export const convertWeight = (weight: number, unit: WeightUnit) => {
  if (unit === "lb") {
    return +(weight * LBS_CONVERTION).toFixed(2);
  }

  return weight;
};

export const convertWeightToKg = (weight: number, unit: WeightUnit) => {
  if (unit === "lb") {
    return +(weight / LBS_CONVERTION).toFixed(2);
  }

  return weight;
};

export const prepareRandomFactsData = (exercises: Array<ExerciseWithData>) => {
  return {
    amountOfWeightLifted: exercises.reduce((prev, curr) => {
      return (
        prev +
        curr.data.reduce((prev, curr) => {
          return prev + curr.weightLifted;
        }, 0)
      );
    }, 0),

    numberOfRepetitionsMade: exercises.reduce((prev, curr) => {
      return (
        prev +
        curr.data.reduce((prev, curr) => {
          return prev + curr.numberOfRepetitions;
        }, 0)
      );
    }, 0),

    numberOfDays: exercises.reduce((prev, curr) => {
      curr.data.forEach((x) => prev.add(x.doneAt));

      return prev;
    }, new Set<string>()).size,

    numberOfExercisesCreated: exercises.length,

    numberOfDataLogged: exercises.reduce((prev, curr) => {
      return prev + curr.data.length;
    }, 0),
  };
};
