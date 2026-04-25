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
  StatsSuccess,
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
    HttpApiEndpoint.patch("patch", "/:exerciseId")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString,
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
    HttpApiEndpoint.get("getTags", "/:exerciseId/tags")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString,
        }),
      )
      .addError(ExerciseNotFound)
      .addSuccess(TagSuccessSchema.pipe(Schema.Array, Schema.maxItems(100))),
  )
  .add(
    HttpApiEndpoint.put("putTags", "/:exerciseId/tags")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString,
        }),
      )
      .setPayload(PutExerciseTagsPayload)
      .addError(ExerciseNotFound)
      .addSuccess(TagSuccessSchema.pipe(Schema.Array, Schema.maxItems(100))),
  )
  .add(
    HttpApiEndpoint.del("delete", "/:exerciseId")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString,
        }),
      )
      .addError(ExerciseNotFound),
  )
  .add(
    HttpApiEndpoint.get("stats", "/stats").addSuccess(StatsSuccess),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/exercises");
