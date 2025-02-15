import { createServerFn } from "@tanstack/start";
import {
  authGuardMiddleware,
  rateLimiterMiddleware,
} from "~/auth/auth.middlewares";
import { selectExercise } from "~/exercise/exercise.services";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";
import { injectDbMiddleware } from "~/db/db.middlewares";

export const selectExerciseAction = createServerFn({ method: "GET" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
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
