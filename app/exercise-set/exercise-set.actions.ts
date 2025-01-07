import { createServerFn } from "@tanstack/start";
import { authGuard } from "~/auth/auth.middlewares";
import { exerciseSetSchema } from "./exercise-set.schemas";
import { db } from "~/utils/db";
import { selectExercise } from "~/exercise/exercise.services";
import pg from "pg";
import {
  createExerciseSet,
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
        {
          exerciseId: data.exerciseId,
          repetitions: data.repetitions,
          weightInKg: data.weightInKg,
        },
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
