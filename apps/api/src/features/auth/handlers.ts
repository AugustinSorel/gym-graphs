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
        Effect.catchTags({
          CryptoHashError: () => new HttpApiError.InternalServerError(),
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          SqlError: () => new HttpApiError.InternalServerError(),
          EmailDeliveryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
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
        Effect.catchTags({
          CryptoHashError: () => new HttpApiError.InternalServerError(),
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("me", () => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        return yield* Effect.succeed(session);
      });
    })
    .handle("signOut", () => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        yield* AuthService.signOut(session.id);
      }).pipe(
        Effect.catchTags({
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
        }),
      );
    })
    .handle("verifyAccount", ({ payload }) => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        const verifyAccount = yield* AuthService.verifyAccount(
          payload.code,
          session.userId,
        );

        yield* AuthCookies.setSessionCookie(
          verifyAccount.token,
          verifyAccount.session.expiresAt,
        );
      }).pipe(
        Effect.catchTags({
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
          TimeoutException: () => new HttpApiError.RequestTimeout(),
          SqlError: () => new HttpApiError.InternalServerError(),
          //FIXME
          Unauthorized: () => new HttpApiError.InternalServerError(),
        }),
      );
    });
});
