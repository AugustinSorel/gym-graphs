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
      .handle("all", ({ urlParams }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          return yield* DashboardTileService.selectAll(
            urlParams,
            session.userId,
          );
        }).pipe(
          Effect.catchTags({
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
            TimeoutException: () => new HttpApiError.RequestTimeout(),
          }),
        );
      })
      .handle("reorder", ({ payload }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          return yield* DashboardTileService.reorder(payload, session.userId);
        }).pipe(
          Effect.catchTags({
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
            TimeoutException: () => new HttpApiError.RequestTimeout(),
          }),
        );
      })
      .handle("patch", ({ path, payload }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          return yield* DashboardTileService.patch(
            path.tileId,
            session.userId,
            payload,
          );
        }).pipe(
          Effect.catchTags({
            DashboardTileNotFound: (e) => e,
            DuplicateDashboardTile: (e) => e,
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
            TimeoutException: () => new HttpApiError.RequestTimeout(),
          }),
        );
      })
      .handle("getTags", ({ path }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          return yield* DashboardTileService.selectTags(
            path.tileId,
            session.userId,
          );
        }).pipe(
          Effect.catchTags({
            DashboardTileNotFound: (e) => e,
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
            TimeoutException: () => new HttpApiError.RequestTimeout(),
          }),
        );
      });
  },
);
