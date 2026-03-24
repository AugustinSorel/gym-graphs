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
import { DuplicateDashboardTile } from "./errors";

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
  .middleware(RequireVerifiedSession)
  .prefix("/dashboard-tiles");
