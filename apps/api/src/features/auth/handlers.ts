import { Api } from "#/api";
import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Effect } from "effect";
import { AuthCookies } from "./cookies";
import { AuthService } from "./service";

export const AuthLive = HttpApiBuilder.group(Api, "Auth", (handlers) => {
  return handlers
    .handle("signUp", ({ payload }) => {
      return Effect.gen(function* () {
        const authService = yield* AuthService;

        const signUp = yield* authService.signUp(payload);

        yield* AuthCookies.setSessionCookie(
          signUp.token,
          signUp.session.expiresAt,
        );
      }).pipe(
        Effect.mapError((e) => {
          if (e._tag === "DuplicateUser") {
            return e;
          }

          if (e._tag === "TimeoutException") {
            return new HttpApiError.RequestTimeout();
          }

          return new HttpApiError.InternalServerError();
        }),
      );
    })
    .handle("signIn", ({ payload }) => {
      return Effect.gen(function* () {
        const authService = yield* AuthService;

        const signIn = yield* authService.signIn(payload);

        yield* AuthCookies.setSessionCookie(
          signIn.token,
          signIn.session.expiresAt,
        );
      }).pipe(
        Effect.mapError((e) => {
          if (e._tag === "InvalidCredentials") {
            return e;
          }

          if (e._tag === "TimeoutException") {
            return new HttpApiError.RequestTimeout();
          }

          return new HttpApiError.InternalServerError();
        }),
      );
    });
});
