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
  try {
    return await db
      .insert(exercise)
      .values({ ...newExercise })
      .returning();
  } catch (e) {
    const error = e as object;

    if ("code" in error && error.code === "23505") {
      return { error: "duplicate" } as const;
    }

    return { error: "unknown" } as const;
  }
};
