import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import {
  DuplicateUser,
  UserNotFound,
  InvalidCredentials,
  Unauthorized,
  AccountNotVerified,
  InvalidVerificationCode,
  VerificationCodeExpired,
  VerificationCodeNotFound,
  PasswordResetTokenExpired,
  PasswordResetTokenNotFound,
} from "@gym-graphs/errors/api";
import {
  SignUpPayload,
  SignInPayload,
  ResetPasswordPayload,
  CurrentSessionSchema,
} from "@gym-graphs/schemas/auth";
import { UserSchema } from "@gym-graphs/schemas/user";
import { VerificationCodeSchema } from "@gym-graphs/schemas/verification-code";
import { RequireSession } from "@gym-graphs/middleware/auth";
import { HttpApi, HttpApiError } from "@effect/platform";

const authApi = HttpApiGroup.make("Auth")
  .add(
    HttpApiEndpoint.post("signUp", "/sign-up")
      .setPayload(SignUpPayload)
      .addError(DuplicateUser)
      .addSuccess(Schema.Void),
  )
  .add(
    HttpApiEndpoint.post("signIn", "/sign-in")
      .setPayload(SignInPayload)
      .addError(InvalidCredentials)
      .addError(AccountNotVerified)
      .addSuccess(Schema.Void),
  )
  .add(
    HttpApiEndpoint.get("me", "/me")
      .middleware(RequireSession)
      .addSuccess(CurrentSessionSchema)
      .addError(Unauthorized),
  )
  .add(
    HttpApiEndpoint.post("verifyAccount", "/verification-code/verify")
      .setPayload(VerificationCodeSchema.pick("code"))
      .middleware(RequireSession)
      .addSuccess(Schema.Void)
      .addError(Unauthorized)
      .addError(VerificationCodeNotFound)
      .addError(InvalidVerificationCode)
      .addError(VerificationCodeExpired),
  )
  .add(
    HttpApiEndpoint.post("resendVerificationCode", "/verification-code")
      .middleware(RequireSession)
      .addSuccess(Schema.Void)
      .addError(Unauthorized),
  )
  .add(
    HttpApiEndpoint.post("signOut", "/sign-out")
      .middleware(RequireSession)
      .addSuccess(Schema.Void)
      .addError(Unauthorized),
  )
  .add(
    HttpApiEndpoint.post("forgotPassword", "/forgot-password")
      .setPayload(UserSchema.pick("email"))
      .addSuccess(Schema.Void)
      .addError(UserNotFound),
  )
  .add(
    HttpApiEndpoint.post("resetPassword", "/reset-password")
      .setPayload(ResetPasswordPayload)
      .addError(PasswordResetTokenExpired)
      .addError(PasswordResetTokenNotFound)
      .addSuccess(Schema.Void),
  )
  .prefix("/auth");

export const Api = HttpApi.make("GymGraphsApi")
  .add(authApi)
  .addError(HttpApiError.InternalServerError)
  .addError(HttpApiError.RequestTimeout)
  .prefix("/api");
