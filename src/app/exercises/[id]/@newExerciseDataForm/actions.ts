"use server";

import type { AddExerciseDataSchema } from "@/schemas/exerciseSchemas";

export const addExerciseDataAction = async (
  exerciseData: AddExerciseDataSchema
) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  //TODO: inset data in db
  console.log(
    `data: ${exerciseData.weightLifted} and ${exerciseData.numberOfRepetitions} to id: ${exerciseData.id}`
  );
};
