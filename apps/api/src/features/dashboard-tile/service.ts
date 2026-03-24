import { Array, Effect, Option } from "effect";
import { DashboardTileRepo } from "./repo";
import type {
  CreateDashboardTilePayload,
  ReorderDashboardTilesPayload,
  SelectAllDashboardTilesUrlParams,
} from "@gym-graphs/shared/dashboard-tile/schemas";
import type { DashboardTile } from "#/integrations/db/schema";
import { withTransaction } from "#/integrations/db/db";
import { ExerciseRepo } from "../exercise/repo";

export class DashboardTileService extends Effect.Service<DashboardTileService>()(
  "DashboardTileService",
  {
    accessors: true,
    dependencies: [DashboardTileRepo.Default, ExerciseRepo.Default],
    effect: Effect.gen(function* () {
      const dashboardTileRepo = yield* DashboardTileRepo;
      const exerciseRepo = yield* ExerciseRepo;

      return {
        create: (
          payload: typeof CreateDashboardTilePayload.Type,
          userId: DashboardTile["userId"],
        ) => {
          return withTransaction(
            Effect.gen(function* () {
              const exercise = yield* exerciseRepo
                .create()
                .pipe(Effect.when(() => payload.type === "exercise"));

              const tile = yield* dashboardTileRepo.create({
                name: payload.name,
                type: payload.type,
                exerciseId: Option.getOrNull(exercise)?.id,
                userId,
              });

              yield* dashboardTileRepo.addTags(tile.id, payload.tagIds).pipe(
                Effect.when(() => {
                  return Array.isNonEmptyReadonlyArray(payload.tagIds);
                }),
              );

              return tile;
            }),
          ).pipe(Effect.timeout(5000));
        },

        selectAll: (
          urlParams: typeof SelectAllDashboardTilesUrlParams.Type,
          userId: DashboardTile["userId"],
        ) => {
          const pageSize = 20;

          return dashboardTileRepo.selectAll(userId, pageSize, urlParams).pipe(
            Effect.map((rows) => {
              const hasMore = rows.length > pageSize;

              const dashboardTiles = hasMore ? rows.slice(0, pageSize) : rows;

              const lastItem = dashboardTiles.at(-1);

              return {
                dashboardTiles,
                nextCursor: hasMore && lastItem ? lastItem.id : null,
              };
            }),
            Effect.timeout(5000),
          );
        },

        reorder: (
          payload: typeof ReorderDashboardTilesPayload.Type,
          userId: DashboardTile["userId"],
        ) => {
          const reversedTileIds = payload.tileIds.toReversed();

          return dashboardTileRepo
            .reorder(reversedTileIds, userId)
            .pipe(Effect.timeout(5000));
        },
      };
    }),
  },
) {}
