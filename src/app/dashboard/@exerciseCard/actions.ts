"use server";

import type { UpdateExerciseNameSchema } from "@/schemas/exerciseSchemas";

export const updateExerciseNameAction = async (e: UpdateExerciseNameSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log("e: ", e);
};
