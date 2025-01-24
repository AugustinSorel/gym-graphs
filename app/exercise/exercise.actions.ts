import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { db } from "~/libs/db.lib";
import {
  createExercise,
  deleteExercise,
  renameExercise,
  selectDashboardExercises,
  selectExercise,
} from "./exercise.services";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import pg from "pg";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";

export const fetchExercisesAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware])
  .handler(async ({ context }) => {
    return selectDashboardExercises(context.user.id, db);
  });

export const createExerciseAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .validator(exerciseSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    try {
      return await createExercise(data.name, context.user.id, db);
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
  .middleware([authGuardMiddleware])
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
        db,
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
  .middleware([authGuardMiddleware])
  .validator(z.object({ exerciseId: exerciseSchema.shape.id }))
  .handler(async ({ context, data }) => {
    return await deleteExercise(context.user.id, data.exerciseId, db);
  });

export const fetchExerciseAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware])
  .validator(z.object({ exerciseId: exerciseSchema.shape.id }))
  .handler(async ({ context, data }) => {
    const exercise = await selectExercise(context.user.id, data.exerciseId, db);

    if (!exercise) {
      throw redirect({ to: "/dashboard" });
    }

    return exercise;
  });
