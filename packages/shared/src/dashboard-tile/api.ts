import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { RequireVerifiedSession } from "#/auth/middlewares";
import {
  CreateDashboardTilePayload,
  DashboardTileSuccess,
  ReorderDashboardTilesPayload,
  ReorderDashboardTilesSuccess,
  SelectAllDashboardTilesSuccess,
  SelectAllDashboardTilesUrlParams,
} from "./schemas";
import { DuplicateDashboardTile, DashboardTileNotFound } from "./errors";
import { TagSuccessSchema } from "#/tag/schemas";
import { Schema } from "effect";

export const dashboardTileApi = HttpApiGroup.make("DashboardTile")
  .add(
    HttpApiEndpoint.post("create", "/")
      .setPayload(CreateDashboardTilePayload)
      .addError(DuplicateDashboardTile)
      .addSuccess(DashboardTileSuccess),
  )
  .add(
    HttpApiEndpoint.get("all", "/")
      .setUrlParams(SelectAllDashboardTilesUrlParams)
      .addSuccess(SelectAllDashboardTilesSuccess),
  )
  .add(
    HttpApiEndpoint.put("reorder", "/reorder")
      .setPayload(ReorderDashboardTilesPayload)
      .addSuccess(ReorderDashboardTilesSuccess),
  )
  .add(
    HttpApiEndpoint.get("getTags", "/:tileId/tags")
      .setPath(
        Schema.Struct({
          tileId: Schema.NumberFromString,
        }),
      )
      .addError(DashboardTileNotFound)
      .addSuccess(TagSuccessSchema.pipe(Schema.Array, Schema.maxItems(100))),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/dashboard-tiles");
