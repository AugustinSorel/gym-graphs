import {
  HttpApiError,
  HttpApiMiddleware,
  HttpApiSecurity,
} from "@effect/platform";
import { AccountNotVerified, Unauthorized } from "./errors";
import { Context, Effect, Layer, Redacted, Schema } from "effect";
import { Database } from "#/integrations/db/db";
import { SessionService } from "../session/service";

export const sessionSecurity = HttpApiSecurity.apiKey({
  in: "cookie",
  key: "session",
});

export class CurrentSession extends Context.Tag("CurrentSession")<
  CurrentSession,
  Effect.Effect.Success<ReturnType<(typeof SessionService)["validateToken"]>>
>() {}

export class RequireSession extends HttpApiMiddleware.Tag<RequireSession>()(
  "Authorization",
  {
    failure: Schema.Union(
      Unauthorized,
      HttpApiError.RequestTimeout,
      HttpApiError.InternalServerError,
    ),
    provides: CurrentSession,
    security: {
      session: sessionSecurity,
    },
  },
) {}

export class RequireVerifiedSession extends HttpApiMiddleware.Tag<RequireVerifiedSession>()(
  "VerifiedAuthorization",
  {
    failure: Schema.Union(
      Unauthorized,
      AccountNotVerified,
      HttpApiError.RequestTimeout,
      HttpApiError.InternalServerError,
    ),
    provides: CurrentSession,
    security: {
      session: sessionSecurity,
    },
  },
) {}

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
