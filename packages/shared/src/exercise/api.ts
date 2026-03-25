import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { ExerciseSuccessSchema } from "./schemas";
import { RequireVerifiedSession } from "#/auth/middlewares";
import { Schema } from "effect";
import { ExerciseNotFound } from "./errors";

export const exerciseApi = HttpApiGroup.make("Exercise")
  .add(
    HttpApiEndpoint.get("get", "/exerciseId")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString,
        }),
      )
      .addError(ExerciseNotFound)
      .addSuccess(ExerciseSuccessSchema),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/exercises");
