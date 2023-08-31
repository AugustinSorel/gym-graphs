"use server";

import { db } from "@/db";
import { exercisesData } from "@/db/schema";
import type {
  UpdateExerciseDataDateSchema,
  UpdateNumberOfRepsSchema,
  UpdateWeightLiftedSchema,
  AddExerciseDataSchema,
  DeleteExerciseDataSchema,
} from "@/schemas/exerciseSchemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const addExerciseDataAction = async (
  exerciseData: AddExerciseDataSchema
) => {
  try {
    const res = await db
      .insert(exercisesData)
      .values({
        exerciseId: exerciseData.exerciseId,
        numberOfRepetitions: exerciseData.numberOfReps,
        weightLifted: exerciseData.weightLifted,
      })
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
  await new Promise((res) => setTimeout(res, 1_000));

  console.log(e);
};
