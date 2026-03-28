import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Api } from "@gym-graphs/shared/api";
import { SetService } from "./service";
import { Effect } from "effect";
import { CurrentSession } from "@gym-graphs/shared/auth/middlewares";
import { Forbidden } from "@gym-graphs/shared/auth/errors";

export const SetLive = HttpApiBuilder.group(Api, "Set", (handlers) => {
  return handlers
    .handle("create", ({ path, payload }) => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        const set = yield* SetService.create(
          path.exerciseId,
          session.userId,
          payload,
        );

        return set;
      }).pipe(
        Effect.catchTags({
          ExerciseNotFound: () => new Forbidden(),
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("patch", ({ path, payload }) => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        return yield* SetService.patch(
          path.exerciseId,
          path.setId,
          session.userId,
          payload,
        );
      }).pipe(
        Effect.catchTags({
          ExerciseNotFound: () => new Forbidden(),
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("delete", ({ path }) => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        yield* SetService.delete(path.exerciseId, path.setId, session.userId);
      }).pipe(
        Effect.catchTags({
          ExerciseNotFound: () => new Forbidden(),
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    });
});
