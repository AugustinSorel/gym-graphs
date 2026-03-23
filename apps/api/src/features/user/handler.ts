import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Api } from "@gym-graphs/shared/api";
import { UserService } from "./service";
import { Effect } from "effect";
import { CurrentSession } from "@gym-graphs/shared/auth/middlewares";

export const UserLive = HttpApiBuilder.group(Api, "User", (handlers) => {
  return handlers.handle("patchByUserId", ({ payload }) => {
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
  });
});
