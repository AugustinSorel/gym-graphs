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
  const oneRepMax =
    exerciseData.weightLifted * (1 + exerciseData.numberOfReps / 30);

  try {
    const res = await db
      .insert(exercisesData)
      .values({
        exerciseId: exerciseData.exerciseId,
        numberOfRepetitions: exerciseData.numberOfReps,
        weightLifted: exerciseData.weightLifted,
        oneRepMax,
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
  await new Promise((res) => setTimeout(res, 1_000));

  console.log(e);
};

export const updateWeightLiftedAction = async (e: UpdateWeightLiftedSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log(e);
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
