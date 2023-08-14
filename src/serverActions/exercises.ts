"use server";

import { db } from "@/db";
import { exercise } from "@/db/schema";
import type {
  DeleteExerciseSchema,
  UpdateExerciseNameSchema,
  NewExerciseNameSchema,
} from "@/schemas/exerciseSchemas";

export const updateExerciseNameAction = async (e: UpdateExerciseNameSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log("e: ", e);
};

export const deleteExerciseAction = async (e: DeleteExerciseSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log("e: ", e);
};

export const addNewExerciseAction = async (
  newExercise: NewExerciseNameSchema
) => {
  return await db
    .insert(exercise)
    .values({ ...newExercise })
    .returning();
};
