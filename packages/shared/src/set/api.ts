import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { RequireVerifiedSession } from "#/auth/middlewares";
import { Schema } from "effect";
import {
  CreateSetPayload,
  PatchSetPayload,
  SetSuccessSchema,
} from "./schemas";
import { SetNotFound } from "./errors";
import { ExerciseSchema } from "#/exercise/schemas";

export const setApi = HttpApiGroup.make("Set")
  .add(
    HttpApiEndpoint.post("create", "/")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString.pipe(
            Schema.compose(ExerciseSchema.fields.id),
          ),
        }),
      )
      .setPayload(CreateSetPayload)
      .addSuccess(SetSuccessSchema),
  )
  .add(
    HttpApiEndpoint.patch("patch", "/:setId")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString.pipe(
            Schema.compose(ExerciseSchema.fields.id),
          ),
          setId: Schema.NumberFromString,
        }),
      )
      .setPayload(PatchSetPayload)
      .addError(SetNotFound)
      .addSuccess(SetSuccessSchema),
  )
  .add(
    HttpApiEndpoint.del("delete", "/:setId")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString.pipe(
            Schema.compose(ExerciseSchema.fields.id),
          ),
          setId: Schema.NumberFromString,
        }),
      )
      .addError(SetNotFound),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/exercises/:exerciseId/sets");
