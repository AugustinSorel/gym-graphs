import { HttpApiError } from "@effect/platform";
import { AccountNotVerified } from "@gym-graphs/errors/api";
import { Effect, Layer, Redacted } from "effect";
import { Database } from "#/integrations/db/db";
import { SessionService } from "../session/service";
import {
  RequireSession,
  RequireVerifiedSession,
} from "@gym-graphs/contracts/api";

export const RequireSessionLive = Layer.effect(
  RequireSession,
  Effect.gen(function* () {
    const sessionService = yield* SessionService;
    const db = yield* Database;

    return {
      session: (token) => {
        return Effect.gen(function* () {
          const candidateToken = Redacted.value(token);

          const session = yield* sessionService
            .validateToken(candidateToken)
            .pipe(
              Effect.provideService(Database, db),
              Effect.catchTags({
                EffectDrizzleQueryError: () =>
                  new HttpApiError.InternalServerError(),
                TimeoutException: () => new HttpApiError.RequestTimeout(),
              }),
            );

          return session;
        });
      },
    };
  }),
);

export const RequireVerifiedSessionLive = Layer.effect(
  RequireVerifiedSession,
  Effect.gen(function* () {
    const sessionService = yield* SessionService;
    const db = yield* Database;

    return {
      session: (token) => {
        return Effect.gen(function* () {
          const candidateToken = Redacted.value(token);

          const session = yield* sessionService
            .validateToken(candidateToken)
            .pipe(
              Effect.provideService(Database, db),
              Effect.catchTags({
                EffectDrizzleQueryError: () =>
                  new HttpApiError.InternalServerError(),
                TimeoutException: () => new HttpApiError.RequestTimeout(),
              }),
            );

          if (!session.user.verifiedAt) {
            return yield* Effect.fail(new AccountNotVerified());
          }

          return session;
        });
      },
    };
  }),
);
