import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Api } from "@gym-graphs/shared/api";
import { UserService } from "./service";
import { Effect } from "effect";
import { CurrentSession } from "@gym-graphs/shared/auth/middlewares";

export const UserLive = HttpApiBuilder.group(Api, "User", (handlers) => {
  return handlers
    .handle("patch", ({ payload }) => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        const user = yield* UserService.patchByUserId(payload, session.userId);

        return user;
      }).pipe(
        Effect.catchTags({
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("delete", () => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        yield* UserService.deleteByUserId(session.userId);
      }).pipe(
        Effect.catchTags({
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("exportData", () => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        return yield* UserService.exportDataByUserId(session.userId);
      }).pipe(
        Effect.catchTag(
          "EffectDrizzleQueryError",
          () => new HttpApiError.InternalServerError(),
        ),
        Effect.catchTag(
          "TimeoutException",
          () => new HttpApiError.RequestTimeout(),
        ),
      );
    });
});
