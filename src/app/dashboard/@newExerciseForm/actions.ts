"use server";

import { addNewExercise } from "@/fakeData";
import type { NewExerciseNameSchema } from "@/schemas/exerciseSchemas";

export const addNewExerciseAction = async (
  newExercise: NewExerciseNameSchema
) => {
  await addNewExercise({ name: newExercise.name });
};
