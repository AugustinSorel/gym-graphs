import { Database, isUniqueViolation } from "#/integrations/db/db";
import {
  dashboardTiles,
  dashboardtilesToTags,
  type DashboardTile,
  type DashboardTilesToTags,
} from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array } from "effect";
import { DuplicateDashboardTile } from "@gym-graphs/shared/dashboard-tile/errors";
import type { SelectAllDashboardTilesUrlParams } from "@gym-graphs/shared/dashboard-tile/schemas";

export class DashboardTileRepo extends Effect.Service<DashboardTileRepo>()(
  "DashboardTileRepo",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const db = yield* Database;

      return {
        create: (input: PgInsertValue<typeof dashboardTiles>) => {
          return db
            .insert(dashboardTiles)
            .values(input)
            .returning()
            .pipe(
              Effect.catchIf(
                (e) => isUniqueViolation(e, "tile_name_dashboard_id_unique"),
                () => DuplicateDashboardTile.withName(input.name.toString()),
              ),
              Effect.andThen((rows) => Array.head(rows).pipe(Effect.orDie)),
            );
        },

        addTags: (
          dashboardTileId: DashboardTilesToTags["dashboardTileId"],
          tagIds: ReadonlyArray<DashboardTilesToTags["tagId"]>,
        ) => {
          return db
            .insert(dashboardtilesToTags)
            .values(
              tagIds.map((tagId) => ({
                tagId,
                dashboardTileId,
              })),
            )
            .returning();
        },

        selectAll: (
          userId: DashboardTile["userId"],
          pageSize: number,
          params: Pick<
            typeof SelectAllDashboardTilesUrlParams.Type,
            "name" | "tags" | "cursor"
          >,
        ) => {
          const filterBy = {
            name: params.name?.length ? params.name : undefined,
            tags: params.tags?.length ? params.tags : undefined,
          };

          return db.query.dashboardTiles.findMany({
            where: {
              userId,
              id: params.cursor ? { lt: params.cursor } : undefined,
              name: {
                ilike: filterBy.name ? `%${filterBy.name}%` : undefined,
              },
              tags: filterBy.tags
                ? {
                    tag: {
                      name: {
                        in: [...filterBy.tags],
                      },
                    },
                  }
                : undefined,
            },

            orderBy: {
              id: "desc",
            },

            limit: pageSize + 1,
          });
        },
      };
    }),
  },
) {}
