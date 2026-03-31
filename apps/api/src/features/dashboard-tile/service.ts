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
import { TagRepo } from "../tag/repo";

export class DashboardTileService extends Effect.Service<DashboardTileService>()(
  "DashboardTileService",
  {
    accessors: true,
    dependencies: [
      DashboardTileRepo.Default,
      ExerciseRepo.Default,
      TagRepo.Default,
    ],
    effect: Effect.gen(function* () {
      const dashboardTileRepo = yield* DashboardTileRepo;
      const exerciseRepo = yield* ExerciseRepo;
      const tagRepo = yield* TagRepo;

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
                dashboardTiles: dashboardTiles.map((tile) => {
                  switch (tile.type) {
                    case "exercise":
                      return {
                        ...tile,
                        type: "exercise" as const,
                        exerciseId: tile.exerciseId!,
                        sets: tile.exercise?.sets ?? [],
                        tags: tile.tags.map((tags) => tags.tag),
                      };
                    case "exerciseSetCount":
                      return {
                        ...tile,
                        type: "exerciseSetCount" as const,
                        sets: tile.exercise?.sets ?? [],
                      };
                    case "exerciseTagCount":
                      return {
                        ...tile,
                        type: "exerciseTagCount" as const,
                        tags: tile.tags.map((tags) => tags.tag),
                      };
                    case "dashboardHeatMap":
                      return {
                        ...tile,
                        type: "dashboardHeatMap" as const,
                      };
                    case "dashboardFunFacts":
                      return {
                        ...tile,
                        type: "dashboardFunFacts" as const,
                      };
                  }
                }),
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

        patch: (
          tileId: DashboardTile["id"],
          userId: DashboardTile["userId"],
          input: { name: string },
        ) => {
          return dashboardTileRepo
            .patch(tileId, userId, input)
            .pipe(Effect.timeout(5000));
        },

        selectTags: (
          tileId: DashboardTile["id"],
          userId: DashboardTile["userId"],
        ) => {
          return Effect.gen(function* () {
            yield* dashboardTileRepo.selectById(tileId, userId);
            return yield* tagRepo.selectTileTags(tileId, userId);
          }).pipe(Effect.timeout(5000));
        },

        setTags: (
          tileId: DashboardTile["id"],
          userId: DashboardTile["userId"],
          tagIds: ReadonlyArray<number>,
        ) => {
          return withTransaction(
            Effect.gen(function* () {
              yield* dashboardTileRepo.selectById(tileId, userId);
              yield* dashboardTileRepo.setTags(tileId, tagIds);
              return yield* tagRepo.selectTileTags(tileId, userId);
            }),
          ).pipe(Effect.timeout(5000));
        },

        delete: (
          tileId: DashboardTile["id"],
          userId: DashboardTile["userId"],
        ) => {
          return withTransaction(
            Effect.gen(function* () {
              const tile = yield* dashboardTileRepo.deleteById(tileId, userId);
              yield* exerciseRepo
                .deleteById(tile.exerciseId!)
                .pipe(Effect.when(() => tile.exerciseId !== null));
            }),
          ).pipe(Effect.timeout(5000));
        },
      };
    }),
  },
) {}
