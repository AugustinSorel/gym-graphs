//FIXME: remove the ugly catches code
"use server";

import { db } from "@/db";
import { exercises, exerciseGridPosition } from "@/db/schema";
import type { Exercise, User } from "@/db/types";
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
      .update(exercises)
      .set({ name: e.name, updatedAt: new Date() })
      .where(eq(exercises.id, e.exerciseId))
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
      .delete(exercises)
      .where(eq(exercises.id, e.exerciseId))
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
    return db.transaction(async (tx) => {
      const exerciseCreated = await tx
        .insert(exercises)
        .values({ name: newExercise.name, userId: newExercise.userId })
        .returning();

      if (exerciseCreated[0]) {
        await tx.insert(exerciseGridPosition).values({
          userId: newExercise.userId,
          exerciseId: exerciseCreated[0].id,
        });
      }

      revalidatePath("/dashboard");
      return exerciseCreated;
    });
  } catch (e) {
    const error = e as object;

    if ("code" in error && error.code === "23505") {
      return { error: "duplicate" } as const;
    }

    return { error: "unknown" } as const;
  }
};

export const updateExercisesGridIndex = async ({
  userId,
  exercisesId,
}: {
  userId: User["id"];
  exercisesId: Exercise["id"][];
}) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(exerciseGridPosition)
      .where(eq(exerciseGridPosition.userId, userId));

    await tx
      .insert(exerciseGridPosition)
      .values(
        exercisesId.reverse().map((exerciseId) => ({ exerciseId, userId }))
      );
  });
};
