import { Effect } from "effect";
import { DashboardTileRepo } from "./repo";

export class DashboardTileService extends Effect.Service<DashboardTileService>()(
  "DashboardTileService",
  {
    accessors: true,
    dependencies: [DashboardTileRepo.Default],
    effect: Effect.gen(function* () {
      const dashboardTileRepo = yield* DashboardTileRepo;

      return {
        create: (payload: Parameters<typeof dashboardTileRepo.create>[0]) => {
          return dashboardTileRepo.create(payload).pipe(Effect.timeout(5000));
        },
      };
    }),
  },
) {}
