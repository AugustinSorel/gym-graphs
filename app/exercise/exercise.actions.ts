import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import {
  createExercise,
  deleteExercise,
  renameExercise,
  selectExercise,
  selectExercisesFrequency,
} from "~/exercise/exercise.services";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import pg from "pg";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { insertTile } from "~/dashboard/dashboard.services";

export const createExerciseAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(exerciseSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    try {
      await context.db.transaction(async (tx) => {
        const exercise = await createExercise(data.name, context.user.id, tx);
        await insertTile(
          "exercise",
          exercise.id,
          context.user.dashboard.id,
          tx,
        );
      });
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateExercise =
        dbError && e.constraint === "exercise_name_unique";

      if (duplicateExercise) {
        throw new Error("exercise already created");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const renameExerciseAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      exerciseId: exerciseSchema.shape.id,
      name: exerciseSchema.shape.name,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      return await renameExercise(
        context.user.id,
        data.exerciseId,
        data.name,
        context.db,
      );
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateExercise =
        dbError && e.constraint === "exercise_name_unique";

      if (duplicateExercise) {
        throw new Error("exercise already created");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const deleteExerciseAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ exerciseId: exerciseSchema.shape.id }))
  .handler(async ({ context, data }) => {
    return await deleteExercise(context.user.id, data.exerciseId, context.db);
  });

export const fetchExerciseAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ exerciseId: exerciseSchema.shape.id }))
  .handler(async ({ context, data }) => {
    const exercise = await selectExercise(
      context.user.id,
      data.exerciseId,
      context.db,
    );

    if (!exercise) {
      throw redirect({ to: "/dashboard" });
    }

    return exercise;
  });

export const selectExercisesFrequencyAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    return selectExercisesFrequency(context.user.id, context.db);
  });
