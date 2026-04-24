import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { RequireVerifiedSession } from "#/auth/middlewares";
import { Schema } from "effect";
import { DuplicateExercise, ExerciseNotFound } from "#/exercise/errors";
import {
  CreateExercisePayload,
  ExerciseSuccess,
  PatchExercisePayload,
  PutExerciseTagsPayload,
  ReorderExercisesPayload,
  ReorderExercisesSuccess,
  SelectAllExercisesSuccess,
  SelectAllExercisesUrlParams,
} from "#/exercise/schemas";
import { TagSuccessSchema } from "#/tag/schemas";

export const exerciseApi = HttpApiGroup.make("Exercise")
  .add(
    HttpApiEndpoint.get("all", "/")
      .setUrlParams(SelectAllExercisesUrlParams)
      .addSuccess(SelectAllExercisesSuccess),
  )
  .add(
    HttpApiEndpoint.put("reorder", "/reorder")
      .setPayload(ReorderExercisesPayload)
      .addSuccess(ReorderExercisesSuccess),
  )
  .add(
    HttpApiEndpoint.post("create", "/")
      .setPayload(CreateExercisePayload)
      .addError(DuplicateExercise)
      .addSuccess(ExerciseSuccess),
  )
  .add(
    HttpApiEndpoint.patch("patch", "/:tileId")
      .setPath(
        Schema.Struct({
          tileId: Schema.NumberFromString,
        }),
      )
      .setPayload(PatchExercisePayload)
      .addError(ExerciseNotFound)
      .addError(DuplicateExercise)
      .addSuccess(ExerciseSuccess),
  )
  .add(
    HttpApiEndpoint.get("get", "/:exerciseId")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString,
        }),
      )
      .addError(ExerciseNotFound)
      .addSuccess(ExerciseSuccess),
  )
  .add(
    HttpApiEndpoint.get("getTags", "/:tileId/tags")
      .setPath(
        Schema.Struct({
          tileId: Schema.NumberFromString,
        }),
      )
      .addError(ExerciseNotFound)
      .addSuccess(TagSuccessSchema.pipe(Schema.Array, Schema.maxItems(100))),
  )
  .add(
    HttpApiEndpoint.put("putTags", "/:tileId/tags")
      .setPath(
        Schema.Struct({
          tileId: Schema.NumberFromString,
        }),
      )
      .setPayload(PutExerciseTagsPayload)
      .addError(ExerciseNotFound)
      .addSuccess(TagSuccessSchema.pipe(Schema.Array, Schema.maxItems(100))),
  )
  .add(
    HttpApiEndpoint.del("delete", "/:tileId")
      .setPath(
        Schema.Struct({
          tileId: Schema.NumberFromString,
        }),
      )
      .addError(ExerciseNotFound),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/exercises");
