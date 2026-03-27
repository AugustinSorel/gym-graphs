import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { RequireVerifiedSession } from "#/auth/middlewares";
import { Schema } from "effect";
import { ExerciseNotFound } from "./errors";
import { ExerciseSchema } from "./schemas";
import { DashboardTileSuccess } from "#/dashboard-tile/schemas";

export const exerciseApi = HttpApiGroup.make("Exercise")
  .add(
    HttpApiEndpoint.get("get", "/exerciseId")
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
  .middleware(RequireVerifiedSession)
  .prefix("/exercises");
