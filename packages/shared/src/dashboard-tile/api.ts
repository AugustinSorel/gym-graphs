import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { RequireVerifiedSession } from "#/auth/middlewares";
import { CreateDashboardTilePayload, DashboardTileSchema } from "./schemas";
import { DuplicateDashboardTile } from "./errors";

export const dashboardTileApi = HttpApiGroup.make("DashboardTile")
  .add(
    HttpApiEndpoint.post("create", "/")
      .setPayload(CreateDashboardTilePayload)
      .addError(DuplicateDashboardTile)
      .addSuccess(DashboardTileSchema),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/dashboard-tiles");
