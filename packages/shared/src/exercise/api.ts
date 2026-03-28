import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { RequireVerifiedSession } from "#/auth/middlewares";
import { Schema } from "effect";
import { ExerciseNotFound } from "./errors";
import { ExerciseSchema } from "./schemas";
import { DashboardTileSuccess } from "#/dashboard-tile/schemas";
import { TagSuccessSchema } from "#/tag/schemas";

export const exerciseApi = HttpApiGroup.make("Exercise")
  .add(
    HttpApiEndpoint.get("get", "/:exerciseId")
      .setPath(
        Schema.Struct({
          exerciseId: Schema.NumberFromString,
        }),
      )
      .addError(ExerciseNotFound)
      .addSuccess(
        Schema.Struct({
          id: ExerciseSchema.fields.id,
          dashboardTile: DashboardTileSuccess,
        }),
      ),
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
  .middleware(RequireVerifiedSession)
  .prefix("/exercises");
