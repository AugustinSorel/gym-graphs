import { Effect } from "effect";
import { DashboardTileRepo } from "./repo";
import type {
  CreateDashboardTilePayload,
  SelectAllDashboardTilesUrlParams,
} from "@gym-graphs/shared/dashboard-tile/schemas";
import type { DashboardTile } from "#/integrations/db/schema";
import { withTransaction } from "#/integrations/db/db";

export class DashboardTileService extends Effect.Service<DashboardTileService>()(
  "DashboardTileService",
  {
    accessors: true,
    dependencies: [DashboardTileRepo.Default],
    effect: Effect.gen(function* () {
      const dashboardTileRepo = yield* DashboardTileRepo;

      return {
        create: (
          payload: typeof CreateDashboardTilePayload.Type,
          userId: DashboardTile["userId"],
        ) => {
          return withTransaction(
            Effect.gen(function* () {
              const tile = yield* dashboardTileRepo.create({
                name: payload.name,
                type: payload.type,
                userId,
              });

              if (payload.tagIds.length) {
                yield* dashboardTileRepo.addTags(tile.id, payload.tagIds);
              }

              return tile;
            }),
          ).pipe(Effect.timeout(5000));
        },

        //FIXME: add pagination
        selectAll: (
          urlParams: typeof SelectAllDashboardTilesUrlParams.Type,
          userId: DashboardTile["userId"],
        ) => {
          return dashboardTileRepo
            .selectAll(userId, urlParams)
            .pipe(Effect.timeout(5000));
        },
      };
    }),
  },
) {}
