import { ServerConfig } from "#/server-config";
import { HttpApiBuilder } from "@effect/platform";
import { Effect, Redacted } from "effect";
import { sessionSecurity } from "@gym-graphs/contracts/api";

export class AuthCookies extends Effect.Service<AuthCookies>()("AuthCookies", {
  accessors: true,
  dependencies: [ServerConfig.Default],
  effect: Effect.gen(function* () {
    const config = yield* ServerConfig;

    return {
      setSessionCookie: (token: string, expiresAt: Date) =>
        HttpApiBuilder.securitySetCookie(
          sessionSecurity,
          Redacted.make(token),
          {
            httpOnly: true,
            sameSite: config.nodeEnv === "production" ? "none" : "lax",
            secure: config.nodeEnv === "production",
            expires: expiresAt,
            path: "/",
            domain:
              config.nodeEnv === "production" ? ".gym-graphs.com" : "localhost",
          },
        ),

      clearSessionCookie: () =>
        HttpApiBuilder.securitySetCookie(sessionSecurity, Redacted.make(""), {
          httpOnly: true,
          expires: new Date(0),
          sameSite: config.nodeEnv === "production" ? "none" : "lax",
          secure: config.nodeEnv === "production",
          maxAge: 0,
          path: "/",
          domain:
            config.nodeEnv === "production" ? ".gym-graphs.com" : "localhost",
        }),
    };
  }),
}) {}
