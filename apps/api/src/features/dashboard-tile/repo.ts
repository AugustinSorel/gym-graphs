import { Database, isUniqueViolation } from "#/integrations/db/db";
import {
  dashboardTiles,
  dashboardtilesToTags,
  type DashboardTile,
  type DashboardTilesToTags,
} from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array } from "effect";
import {
  DuplicateDashboardTile,
  DashboardTileNotFound,
} from "@gym-graphs/shared/dashboard-tile/errors";
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

        createMany: (input: Array<PgInsertValue<typeof dashboardTiles>>) => {
          return db.insert(dashboardTiles).values(input).returning();
        },

        selectById: (
          tileId: DashboardTile["id"],
          userId: DashboardTile["userId"],
        ) => {
          return Effect.gen(function* () {
            const tile = yield* db.query.dashboardTiles.findFirst({
              where: {
                id: tileId,
                userId,
              },
            });

            if (!tile) {
              return yield* Effect.fail(new DashboardTileNotFound());
            }

            return tile;
          });
        },

        patch: (
          tileId: DashboardTile["id"],
          userId: DashboardTile["userId"],
          input: { name: string },
        ) => {
          return db
            .update(dashboardTiles)
            .set({ name: input.name })
            .where(
              and(
                eq(dashboardTiles.id, tileId),
                eq(dashboardTiles.userId, userId),
              ),
            )
            .returning()
            .pipe(
              Effect.catchIf(
                (e) =>
                  isUniqueViolation(e, "dashboard_tiles_name_user_id_unique"),
                () => DuplicateDashboardTile.withName(input.name),
              ),
              Effect.andThen((rows) =>
                Array.head(rows).pipe(
                  Effect.mapError(() => new DashboardTileNotFound()),
                ),
              ),
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

        addTag: (
          dashboardTileId: DashboardTilesToTags["dashboardTileId"],
          tagId: DashboardTilesToTags["tagId"],
        ) => {
          return db
            .insert(dashboardtilesToTags)
            .values({ tagId, dashboardTileId })
            .returning();
        },

        removeTag: (
          dashboardTileId: DashboardTilesToTags["dashboardTileId"],
          tagId: DashboardTilesToTags["tagId"],
        ) => {
          return db
            .delete(dashboardtilesToTags)
            .where(
              and(
                eq(dashboardtilesToTags.dashboardTileId, dashboardTileId),
                eq(dashboardtilesToTags.tagId, tagId),
              ),
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
