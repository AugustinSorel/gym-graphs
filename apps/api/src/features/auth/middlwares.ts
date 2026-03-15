import { HttpApiMiddleware } from "@effect/platform";
import { Unauthorized } from "./errors";
import { sessionSecurity } from "./cookies";
import { Context, Effect, Layer, Redacted } from "effect";
import { Database } from "#/integrations/db/db";
import { SessionService } from "../session/service";

export class CurrentSession extends Context.Tag("CurrentSession")<
  CurrentSession,
  Effect.Effect.Success<ReturnType<(typeof SessionService)["validateToken"]>>
>() {}

export class RequireSession extends HttpApiMiddleware.Tag<RequireSession>()(
  "Authorization",
  {
    failure: Unauthorized,
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
              Effect.mapError(() => new Unauthorized()),
            );

          return session;
        });
      },
    };
  }),
);
