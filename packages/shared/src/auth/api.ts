import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import {
  InvalidCredentials,
  Unauthorized,
  AccountNotVerified,
} from "#/auth/errors";
import { DuplicateUser, UserNotFound } from "#/user/errors";
import {
  PasswordResetTokenExpired,
  PasswordResetTokenNotFound,
} from "#/password-reset-token/errors";
import {
  InvalidVerificationCode,
  VerificationCodeExpired,
  VerificationCodeNotFound,
} from "#/verification-code/errors";
import {
  SignUpPayload,
  SignInPayload,
  ResetPasswordPayload,
  CurrentSessionSchema,
  ForgotPassworPayload,
} from "#/auth/schemas";
import { VerificationCodeSchema } from "#/verification-code/schemas";
import { RequireSession } from "#/auth/middlewares";

export const authApi = HttpApiGroup.make("Auth")
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
      .setPayload(ForgotPassworPayload)
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
