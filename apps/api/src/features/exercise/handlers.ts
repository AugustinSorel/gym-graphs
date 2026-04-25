import { Api } from "@gym-graphs/shared/api";
import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Effect } from "effect";
import { ExerciseService } from "./service";
import { CurrentSession } from "@gym-graphs/shared/auth/middlewares";

export const ExerciseLive = HttpApiBuilder.group(
  Api,
  "Exercise",
  (handlers) => {
    return handlers
      .handle("get", ({ path }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          return yield* ExerciseService.selectByExerciseId(
            path.exerciseId,
            session.userId,
          );
        }).pipe(
          Effect.catchTags({
            TimeoutException: () => new HttpApiError.RequestTimeout(),
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
          }),
        );
      })
      .handle("create", ({ payload }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          return yield* ExerciseService.create(payload, session.userId);
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

          return yield* ExerciseService.selectAll(urlParams, session.userId);
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

          return yield* ExerciseService.reorder(payload, session.userId);
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

          return yield* ExerciseService.patch(
            path.exerciseId,
            session.userId,
            payload,
          );
        }).pipe(
          Effect.catchTags({
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
            TimeoutException: () => new HttpApiError.RequestTimeout(),
          }),
        );
      })
      .handle("getTags", ({ path }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          return yield* ExerciseService.selectTags(
            path.exerciseId,
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
      .handle("putTags", ({ path, payload }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          return yield* ExerciseService.setTags(
            path.exerciseId,
            session.userId,
            payload.tagIds,
          );
        }).pipe(
          Effect.catchTags({
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
            SqlError: () => new HttpApiError.InternalServerError(),
            TimeoutException: () => new HttpApiError.RequestTimeout(),
          }),
        );
      })
      .handle("delete", ({ path }) => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          yield* ExerciseService.delete(path.exerciseId, session.userId);
        }).pipe(
          Effect.catchTags({
            EffectDrizzleQueryError: () =>
              new HttpApiError.InternalServerError(),
            TimeoutException: () => new HttpApiError.RequestTimeout(),
          }),
        );
      })
      .handle("stats", () => {
        return Effect.gen(function* () {
          const session = yield* CurrentSession;

          return yield* ExerciseService.getStats(session.userId);
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
