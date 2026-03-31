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
import { Forbidden } from "#/auth/errors";

export const setApi = HttpApiGroup.make("Set")
  .add(
    HttpApiEndpoint.get("getAll", "/")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString.pipe(
            Schema.compose(ExerciseSchema.fields.id),
          ),
        }),
      )
      .addError(Forbidden)
      .addSuccess(SetSuccessSchema.pipe(Schema.Array)),
  )
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
      .addError(Forbidden)
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
      .addError(Forbidden)
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
      .addError(Forbidden)
      .addError(SetNotFound),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/exercises/:exerciseId/sets");
