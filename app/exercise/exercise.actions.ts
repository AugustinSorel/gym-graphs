import { createServerFn } from "@tanstack/react-start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { selectExercise } from "~/exercise/exercise.services";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { AppError } from "~/libs/error";
import { setResponseStatus } from "@tanstack/react-start/server";

export const selectExerciseAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ exerciseId: exerciseSchema.shape.id }))
  .handler(async ({ context, data }) => {
    try {
      const exercise = await selectExercise(
        context.user.id,
        data.exerciseId,
        context.db,
      );

      if (!exercise) {
        throw redirect({ to: "/dashboard" });
      }

      return exercise;
    } catch (e) {
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });
