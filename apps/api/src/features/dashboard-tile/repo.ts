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
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";

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
              index: "desc",
            },

            limit: pageSize + 1,
          });
        },

        reorder: (
          tileIds: Array<DashboardTile["id"]>,
          userId: DashboardTile["userId"],
        ) => {
          const sqlChunks: Array<SQL> = [];

          sqlChunks.push(sql`(case`);

          tileIds.forEach((tileId, i) => {
            sqlChunks.push(
              sql`when ${dashboardTiles.id} = ${tileId} then cast(${i} as integer)`,
            );
          });

          sqlChunks.push(sql`end)`);

          const finalSql = sql.join(sqlChunks, sql.raw(" "));
          return db
            .update(dashboardTiles)
            .set({ index: finalSql })
            .where(
              and(
                inArray(dashboardTiles.id, tileIds),
                eq(dashboardTiles.userId, userId),
              ),
            )
            .returning();
        },
      };
    }),
  },
) {}
