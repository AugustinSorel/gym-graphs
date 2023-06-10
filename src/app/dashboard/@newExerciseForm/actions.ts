"use server";

import type { NewExerciseNameSchema } from "@/schemas/exerciseSchemas";

export const addNewExerciseAction = async (
  newExercise: NewExerciseNameSchema
) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  //TODO: inset data in db
  console.log(`data: ${newExercise.name}`);
};
