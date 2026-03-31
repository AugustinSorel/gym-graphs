import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Api } from "@gym-graphs/shared/api";
import { TagService } from "./service";
import { Effect } from "effect";
import { CurrentSession } from "@gym-graphs/shared/auth/middlewares";

export const TagLive = HttpApiBuilder.group(Api, "Tag", (handlers) => {
  return handlers
    .handle("create", ({ payload }) => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        const tag = yield* TagService.create(payload, session.userId);

        return tag;
      }).pipe(
        Effect.catchTags({
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("all", () => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        const tags = yield* TagService.selectAll(session.userId);

        return tags;
      }).pipe(
        Effect.catchTags({
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("delete", ({ path }) => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        yield* TagService.deleteByTagId(path.tagId, session.userId);
      }).pipe(
        Effect.catchTags({
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("patch", ({ path, payload }) => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        yield* TagService.patchByTagId(payload, path.tagId, session.userId);
      }).pipe(
        Effect.catchTags({
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    });
});
