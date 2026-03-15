import { Api } from "#/api";
import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Effect } from "effect";
import { AuthCookies } from "./cookies";
import { AuthService } from "./service";
import { CurrentSession } from "./security";

export const AuthLive = HttpApiBuilder.group(Api, "Auth", (handlers) => {
  return handlers
    .handle("signUp", ({ payload }) => {
      return Effect.gen(function* () {
        const signUp = yield* AuthService.signUp(payload);

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
        const signIn = yield* AuthService.signIn(payload);

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
    })
    .handle("me", () => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        return yield* Effect.succeed(session);
      }).pipe(
        Effect.mapError(() => {
          return new HttpApiError.InternalServerError();
        }),
      );
    })
    .handle("signOut", () => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        yield* AuthService.signOut(session.id);
      }).pipe(
        Effect.mapError((e) => {
          if (e._tag === "TimeoutException") {
            return new HttpApiError.RequestTimeout();
          }

          return new HttpApiError.InternalServerError();
        }),
      );
    });
});
