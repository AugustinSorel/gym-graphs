"use server";

import { db } from "@/db";
import { exercise } from "@/db/schema";
import type {
  DeleteExerciseSchema,
  UpdateExerciseNameSchema,
  NewExerciseNameSchema,
} from "@/schemas/exerciseSchemas";
import { eq } from "drizzle-orm";

export const updateExerciseNameAction = async (e: UpdateExerciseNameSchema) => {
  try {
    return await db
      .update(exercise)
      .set({ name: e.name })
      .where(eq(exercise.id, e.exerciseId))
      .returning();
  } catch (e) {
    const error = e as object;

    if ("code" in error && error.code === "23505") {
      return { error: "duplicate" } as const;
    }

    return { error: "unknown" } as const;
  }
};

export const deleteExerciseAction = async (e: DeleteExerciseSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log("e: ", e);
};

//TODO:revalidate path
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
