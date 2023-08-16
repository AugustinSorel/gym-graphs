//FIXME: remove the ugly catches code
"use server";

import { db } from "@/db";
import { exercise } from "@/db/schema";
import type {
  DeleteExerciseSchema,
  UpdateExerciseNameSchema,
  NewExerciseNameSchema,
} from "@/schemas/exerciseSchemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const updateExerciseNameAction = async (e: UpdateExerciseNameSchema) => {
  try {
    const res = await db
      .update(exercise)
      .set({ name: e.name })
      .where(eq(exercise.id, e.exerciseId))
      .returning();

    revalidatePath("/dashboard");

    return res;
  } catch (e) {
    const error = e as object;

    if ("code" in error && error.code === "23505") {
      return { error: "duplicate" } as const;
    }

    return { error: "unknown" } as const;
  }
};

export const deleteExerciseAction = async (e: DeleteExerciseSchema) => {
  try {
    const res = await db
      .delete(exercise)
      .where(eq(exercise.id, e.exerciseId))
      .returning();

    revalidatePath("/dashboard");

    return res;
  } catch (e) {
    return { error: "unknown" } as const;
  }
};

export const addNewExerciseAction = async (
  newExercise: NewExerciseNameSchema
) => {
  try {
    const res = await db
      .insert(exercise)
      .values({ ...newExercise })
      .returning();

    revalidatePath("/dashboard");

    return res;
  } catch (e) {
    const error = e as object;

    if ("code" in error && error.code === "23505") {
      return { error: "duplicate" } as const;
    }

    return { error: "unknown" } as const;
  }
};

export const updateExercisesGridIndex = async (gridItems: string[]) => {
  await db.transaction(async (tx) => {
    gridItems.reverse().forEach(async (item, i) => {
      await tx
        .update(exercise)
        .set({ gridIndex: i })
        .where(eq(exercise.id, item));
    });
  });

  console.log("done");
};
