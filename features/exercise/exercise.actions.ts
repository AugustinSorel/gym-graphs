import { createServerFn } from "@tanstack/start";
import { authGuard } from "../auth/auth.middlewares";
import { db } from "~/features/utils/db";
import { createExercise, selectDashboardExercises } from "./exercise.services";
import { exerciseSchema } from "./exericse.schemas";
import pg from "pg";

export const fetchExercisesAction = createServerFn({ method: "GET" })
  .middleware([authGuard])
  .handler(async ({ context }) => {
    return selectDashboardExercises(context.user.id, db);
  });

export const createExerciseAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .validator(exerciseSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    try {
      return await createExercise(
        {
          name: data.name,
          userId: context.user.id,
        },
        db,
      );
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateExercise =
        dbError && e.constraint === "exercise_user_id_name_pk";

      if (duplicateExercise) {
        throw new Error("exercise already created");
      }

      throw new Error(e);
    }
  });
