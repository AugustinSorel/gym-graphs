import { Api } from "@gym-graphs/shared/api";
import {
  HttpApiBuilder,
  HttpApiError,
  HttpApiSecurity,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import { Effect, Redacted, Schema } from "effect";
import { GithubState } from "@gym-graphs/shared/oauth/schemas";
import { ServerConfig } from "#/server-config";
import { OAuthService } from "../oauth/service";
import { AuthCookies } from "../auth/cookies";
import { Forbidden } from "@gym-graphs/shared/auth/errors";
import { ParsingGithubOauthStateFailed } from "@gym-graphs/shared/oauth/errors";

export const OAuthLive = HttpApiBuilder.group(Api, "OAuth", (handlers) => {
  return handlers
    .handle("githubSignIn", ({ urlParams }) => {
      return Effect.gen(function* () {
        const config = yield* ServerConfig;

        const githubUrl = yield* OAuthService.generateGithubOAuthUrl(
          urlParams.callbackUrl,
        );

        yield* HttpApiBuilder.securitySetCookie(
          HttpApiSecurity.apiKey({
            in: "cookie",
            key: "github_oauth_state",
          }),
          Redacted.make(githubUrl.state),
          {
            httpOnly: true,
            sameSite: config.nodeEnv === "production" ? "none" : "lax",
            secure: config.nodeEnv === "production",
            maxAge: 60 * 60,
            path: "/",
          },
        );

        return yield* Effect.succeed(githubUrl.url.toString());
      }).pipe(
        Effect.catchTags({
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("githubCallback", ({ urlParams }) => {
      return Effect.gen(function* () {
        const cookies = yield* HttpServerRequest.schemaCookies(
          Schema.Struct({
            github_oauth_state: GithubState,
          }),
        ).pipe(Effect.mapError(() => new ParsingGithubOauthStateFailed()));

        const candidateState = cookies.github_oauth_state;

        if (candidateState !== urlParams.state) {
          return yield* new Forbidden({ message: "states are not matching" });
        }

        const tokens = yield* OAuthService.validateGithubCode(urlParams.code);

        const githubSignIn = yield* OAuthService.githubSignIn(
          tokens.accessToken,
        );

        yield* AuthCookies.setSessionCookie(
          githubSignIn.token,
          githubSignIn.session.expiresAt,
        );

        const config = yield* ServerConfig;

        const url = urlParams.redirectUrl
          ? urlParams.redirectUrl
          : `${config.url.web}/dashboard`;

        return HttpServerResponse.redirect(url);
      }).pipe(
        Effect.catchTags({
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
          SqlError: () => new HttpApiError.InternalServerError(),
        }),
      );
    });
});
