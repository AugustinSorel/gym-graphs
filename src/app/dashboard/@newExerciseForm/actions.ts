"use server";

import { addNewExercise } from "@/fakeData";
import type { NewExerciseNameSchema } from "@/schemas/exerciseSchemas";

export const addNewExerciseAction = async (
  newExercise: NewExerciseNameSchema
) => {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });

  addNewExercise({ name: newExercise.name });
};
