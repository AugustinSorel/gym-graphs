import { ServerConfig } from "#/env";
import { HttpApiBuilder, HttpApiSecurity } from "@effect/platform";
import { Effect, Redacted } from "effect";

export const sessionSecurity = HttpApiSecurity.apiKey({
  in: "cookie",
  key: "session",
});

export class AuthCookies extends Effect.Service<AuthCookies>()("AuthCookies", {
  accessors: true,
  dependencies: [ServerConfig.Default],
  effect: Effect.gen(function* () {
    const env = yield* ServerConfig;

    return {
      setSessionCookie: (token: string, expiresAt: Date) =>
        HttpApiBuilder.securitySetCookie(
          sessionSecurity,
          Redacted.make(token),
          {
            httpOnly: true,
            sameSite: env.nodeEnv === "production" ? "none" : "lax",
            secure: env.nodeEnv === "production",
            expires: expiresAt,
            path: "/",
            domain:
              env.nodeEnv === "production" ? ".gym-graphs.com" : "localhost",
          },
        ),

      clearSessionCookie: () =>
        HttpApiBuilder.securitySetCookie(sessionSecurity, Redacted.make(""), {
          httpOnly: true,
          expires: new Date(0),
          sameSite: env.nodeEnv === "production" ? "none" : "lax",
          secure: env.nodeEnv === "production",
          maxAge: 0,
          path: "/",
          domain:
            env.nodeEnv === "production" ? ".gym-graphs.com" : "localhost",
        }),
    };
  }),
}) {}
