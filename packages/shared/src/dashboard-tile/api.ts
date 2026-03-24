import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { RequireVerifiedSession } from "#/auth/middlewares";
import {
  CreateDashboardTilePayload,
  DashboardTileSuccess,
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
  .middleware(RequireVerifiedSession)
  .prefix("/dashboard-tiles");
