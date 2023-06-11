"use server";

import type {
  DeleteExerciseSchema,
  UpdateExerciseNameSchema,
} from "@/schemas/exerciseSchemas";

export const updateExerciseNameAction = async (e: UpdateExerciseNameSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log("e: ", e);
};

export const deleteExerciseAction = async (e: DeleteExerciseSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log("e: ", e);
};
