"use server";

import { db } from "@/db";
import { exercisesData } from "@/db/schema";
import { ServerActionError, privateAction } from "@/lib/safeAction";
import {
  type UpdateExerciseDataDateSchema,
  type UpdateNumberOfRepsSchema,
  type UpdateWeightLiftedSchema,
  type DeleteExerciseDataSchema,
  addExerciseDataSchema,
} from "@/schemas/exerciseSchemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const addExerciseDataAction = privateAction(
  addExerciseDataSchema,
  async (data) => {
    try {
      const res = await db
        .insert(exercisesData)
        .values({
          exerciseId: data.exerciseId,
          numberOfRepetitions: data.numberOfReps,
          weightLifted: data.weightLifted,
        })
        .returning();

      revalidatePath("/exercises/[id]");

      return res;
    } catch (e) {
      const error = e as object;

      if ("code" in error && error.code === "23505") {
        throw new ServerActionError("you have already entered today's data");
      }

      throw new Error("unhanndled server error");
    }
  }
);

export const updateNumberOfRepsAction = async (e: UpdateNumberOfRepsSchema) => {
  try {
    const res = await db
      .update(exercisesData)
      .set({
        numberOfRepetitions: e.numberOfReps,
        updatedAt: new Date(),
      })
      .where(eq(exercisesData.id, e.exerciseDataId))
      .returning();

    revalidatePath("/exercises/[id]");

    return res;
  } catch (e) {
    return { error: "unknown" } as const;
  }
};

export const updateWeightLiftedAction = async (e: UpdateWeightLiftedSchema) => {
  try {
    const res = await db
      .update(exercisesData)
      .set({
        weightLifted: e.weightLifted,
        updatedAt: new Date(),
      })
      .where(eq(exercisesData.id, e.exerciseDataId))
      .returning();

    revalidatePath("/exercises/[id]");

    return res;
  } catch (e) {
    return { error: "unknown" } as const;
  }
};

export const deleteDataAction = async (e: DeleteExerciseDataSchema) => {
  try {
    const res = await db
      .delete(exercisesData)
      .where(eq(exercisesData.id, e.exerciseDataId))
      .returning();

    revalidatePath("/exercises/[id]");

    return res;
  } catch (e) {
    return { error: "unknown" } as const;
  }
};

export const updateExerciseDataDate = async (
  e: UpdateExerciseDataDateSchema
) => {
  try {
    const res = await db
      .update(exercisesData)
      .set({
        doneAt: e.doneAt.toString(),
        updatedAt: new Date(),
      })
      .where(eq(exercisesData.id, e.exerciseDataId))
      .returning();

    revalidatePath("/exercises/[id]");

    return res;
  } catch (e) {
    const error = e as object;

    if ("code" in error && error.code === "23505") {
      return { error: "duplicate" } as const;
    }

    return { error: "unknown" } as const;
  }
};
