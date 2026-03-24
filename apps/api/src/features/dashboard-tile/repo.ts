import { Database, isUniqueViolation } from "#/integrations/db/db";
import {
  dashboardTiles,
  dashboardtilesToTags,
  type DashboardTilesToTags,
} from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array } from "effect";
import { DuplicateDashboardTile } from "@gym-graphs/shared/dashboard-tile/errors";

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
      };
    }),
  },
) {}
