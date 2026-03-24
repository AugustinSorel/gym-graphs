import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Api } from "@gym-graphs/shared/api";
import { DashboardTileService } from "./service";
import { Effect } from "effect";
import { CurrentSession } from "@gym-graphs/shared/auth/middlewares";

export const DashboardTileLive = HttpApiBuilder.group(
  Api,
  "DashboardTile",
  (handlers) => {
    return handlers
      .handle("create", ({ payload }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          const tile = yield* DashboardTileService.create(
            payload,
            session.userId,
          );

          return tile;
        }).pipe(
          Effect.catchTags({
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
            SqlError: () => new HttpApiError.InternalServerError(),
            TimeoutException: () => new HttpApiError.RequestTimeout(),
          }),
        );
      })
      .handle("all", () => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          const dashboardTiles = yield* DashboardTileService.selectAll(
            session.userId,
          );

          return {
            dashboardTiles,
            nextCursor: 1,
          };
        }).pipe(
          Effect.catchTags({
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
            TimeoutException: () => new HttpApiError.RequestTimeout(),
          }),
        );
      });
  },
);
