import { HttpApiMiddleware } from "@effect/platform";
import { Unauthorized } from "./errors";
import { sessionSecurity } from "./cookies";
import { Context, Effect, Layer, Redacted } from "effect";
import { AuthService } from "./service";
import { Database } from "#/integrations/db/db";

export class CurrentUser extends Context.Tag("CurrentUser")<
  CurrentUser,
  Effect.Effect.Success<
    ReturnType<(typeof AuthService)["validateSessionToken"]>
  >
>() {}

export class Authorization extends HttpApiMiddleware.Tag<Authorization>()(
  "Authorization",
  {
    failure: Unauthorized,
    provides: CurrentUser,
    security: {
      session: sessionSecurity,
    },
  },
) {}

export const AuthorizationLive = Layer.effect(
  Authorization,
  Effect.gen(function* () {
    const auth = yield* AuthService;
    const db = yield* Database;

    return {
      session: (token) => {
        return Effect.gen(function* () {
          const candidateToken = Redacted.value(token);

          const session = yield* auth.validateSessionToken(candidateToken).pipe(
            Effect.provideService(Database, db),
            Effect.mapError(() => new Unauthorized()),
          );

          return session;
        });
      },
    };
  }),
);
