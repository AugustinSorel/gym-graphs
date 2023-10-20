"use server";

import { db } from "@/db";
import { exercises, exerciseGridPosition } from "@/db/schema";
import { ServerActionError, privateAction } from "@/lib/safeAction";
import {
  updateExerciseNameSchema,
  deleteExerciseSchema,
  newExerciseNameSchema,
  updateExercisesGridIndexSchema,
  getAllExercisesSchema,
  updateExerciseMuscleGroupsSchema,
} from "@/schemas/exerciseSchemas";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const updateExerciseNameAction = privateAction(
  updateExerciseNameSchema,
  async (data, ctx) => {
    try {
      const res = await db
        .update(exercises)
        .set({ name: data.name, updatedAt: new Date() })
        .where(
          and(
            eq(exercises.id, data.exerciseId),
            eq(exercises.userId, ctx.userId)
          )
        )
        .returning();

      revalidatePath("/dashboard");

      return res;
    } catch (e) {
      const error = e as object;

      if ("code" in error && error.code === "23505") {
        throw new ServerActionError(`${data.name} is already used`);
      }

      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  }
);

export const deleteExerciseAction = privateAction(
  deleteExerciseSchema,
  async (data, ctx) => {
    const res = await db
      .delete(exercises)
      .where(
        and(eq(exercises.id, data.exerciseId), eq(exercises.userId, ctx.userId))
      )
      .returning();

    revalidatePath("/dashboard");

    return res;
  }
);

export const addNewExerciseAction = privateAction(
  newExerciseNameSchema,
  async (data, ctx) => {
    try {
      return await db.transaction(async (tx) => {
        const exerciseCreated = await tx
          .insert(exercises)
          .values({ name: data.name, userId: ctx.userId })
          .returning();

        if (exerciseCreated[0]) {
          await tx.insert(exerciseGridPosition).values({
            userId: ctx.userId,
            exerciseId: exerciseCreated[0].id,
          });
        }

        revalidatePath("/dashboard");
        return exerciseCreated;
      });
    } catch (e) {
      const error = e as object;

      if ("code" in error && error.code === "23505") {
        throw new ServerActionError(`${data.name} is already used`);
      }

      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  }
);

export const updateExercisesGridIndex = privateAction(
  updateExercisesGridIndexSchema,
  async (data, ctx) => {
    await db.transaction(async (tx) => {
      await tx
        .delete(exerciseGridPosition)
        .where(eq(exerciseGridPosition.userId, ctx.userId));

      await tx
        .insert(exerciseGridPosition)
        .values(
          data.exercisesId
            .reverse()
            .map((exerciseId) => ({ exerciseId, userId: ctx.userId }))
        );
    });

    revalidatePath("/dashboard");
  }
);

export const getAllExercises = privateAction(
  getAllExercisesSchema,
  async (_, ctx) => {
    return db.select().from(exercises).where(eq(exercises.userId, ctx.userId));
  }
);

export const updateExerciseMuscleGroups = privateAction(
  updateExerciseMuscleGroupsSchema,
  async (data) => {
    await db
      .update(exercises)
      .set({ muscleGroups: data.muscleGroups })
      .where(eq(exercises.id, data.exerciseId));

    revalidatePath("/dashboard");
  }
);
