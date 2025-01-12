import { createServerFn } from "@tanstack/start";
import { authGuard } from "~/auth/auth.middlewares";
import { exerciseSetSchema } from "./exercise-set.schemas";
import { db } from "~/utils/db";
import { selectExercise } from "~/exercise/exercise.services";
import pg from "pg";
import {
  createExerciseSet,
  deleteExerciseSet,
  updateExerciseSetDoneAt,
  updateExerciseSetRepetitions,
  updateExerciseSetWeight,
} from "~/exercise-set/exercise-set.services";
import { z } from "zod";

export const createExerciseSetAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .validator(
    exerciseSetSchema.pick({
      exerciseId: true,
      repetitions: true,
      weightInKg: true,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      const exercise = await selectExercise(
        context.user.id,
        data.exerciseId,
        db,
      );

      if (!exercise) {
        throw new Error("exercise not found");
      }

      await createExerciseSet(
        data.weightInKg,
        data.repetitions,
        data.exerciseId,
        db,
      );
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateSet =
        dbError && e.constraint === "exercise_set_done_at_exercise_id_unique";

      if (duplicateSet) {
        throw new Error("set already created for today");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const updateExerciseSetWeightAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .validator(
    z.object({
      weightInKg: exerciseSetSchema.shape.weightInKg,
      exerciseSetId: exerciseSetSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await updateExerciseSetWeight(
      data.exerciseSetId,
      context.user.id,
      data.weightInKg,
      db,
    );
  });

export const updateExerciseSetRepetitionsAction = createServerFn({
  method: "POST",
})
  .middleware([authGuard])
  .validator(
    z.object({
      repetitions: exerciseSetSchema.shape.repetitions,
      exerciseSetId: exerciseSetSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await updateExerciseSetRepetitions(
      data.exerciseSetId,
      context.user.id,
      data.repetitions,
      db,
    );
  });

export const updateExerciseSetDoneAtAction = createServerFn({
  method: "POST",
})
  .middleware([authGuard])
  .validator(
    z.object({
      doneAt: exerciseSetSchema.shape.doneAt,
      exerciseSetId: exerciseSetSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      await updateExerciseSetDoneAt(
        data.exerciseSetId,
        context.user.id,
        data.doneAt,
        db,
      );
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateSet =
        dbError && e.constraint === "exercise_set_done_at_exercise_id_unique";

      if (duplicateSet) {
        throw new Error("set already created for this date");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const deleteExerciseSetAction = createServerFn({
  method: "POST",
})
  .middleware([authGuard])
  .validator(z.object({ exerciseSetId: exerciseSetSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteExerciseSet(data.exerciseSetId, context.user.id, db);
  });
