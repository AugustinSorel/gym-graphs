import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { pipe, Schema } from "effect";
import { DuplicateUser, UserNotFound } from "../user/errors";
import { InvalidCredentials, Unauthorized, AccountNotVerified } from "./errors";
import {
  InvalidVerificationCode,
  VerificationCodeExpired,
  VerificationCodeNotFound,
} from "#/features/verification-code/errors";
import { RequireSession } from "./security";
import {
  PasswordResetTokenExpired,
  PasswordResetTokenNotFound,
} from "../password-reset-token/errors";

const UserSchema = Schema.Struct({
  email: Schema.propertySignature(
    pipe(
      Schema.String.annotations({
        message: () => "email must be a valid string",
      }),
      Schema.nonEmptyString({ message: () => "email is required" }),
      Schema.minLength(3, {
        message: () => "email must be at least 3 characters",
      }),
      Schema.maxLength(255, {
        message: () => "email must be at most 255 characters",
      }),
      Schema.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        description: "a valid email address",
        message: () => "email must be valid",
      }),
    ),
  ).annotations({ missingMessage: () => "email is required" }),

  password: Schema.propertySignature(
    pipe(
      Schema.String.annotations({
        message: () => "password must be a valid string",
      }),
      Schema.nonEmptyString({ message: () => "password is required" }),
      Schema.minLength(3, {
        message: () => "password must be at least 3 characters",
      }),
      Schema.maxLength(255, {
        message: () => "password must be at most 255 characters",
      }),
    ),
  ).annotations({ missingMessage: () => "password is required" }),
});

const ResetPasswordToken = Schema.Struct({
  token: Schema.propertySignature(
    pipe(
      Schema.String.annotations({
        message: () => "token must be a valid string",
      }),
      Schema.nonEmptyString({ message: () => "token is required" }),
      Schema.minLength(3, {
        message: () => "token must be at least 3 characters",
      }),
      Schema.maxLength(255, {
        message: () => "token must be at most 255 characters",
      }),
    ),
  ).annotations({ missingMessage: () => "token is required" }),
});

export const SignUpPayload = Schema.Struct({
  email: UserSchema.fields.email,
  password: UserSchema.fields.password,
  confirmPassword: UserSchema.fields.password,
}).pipe(
  Schema.filter((schema) => schema.confirmPassword === schema.password, {
    message: () => "password don't match",
  }),
);

export const SignInPayload = Schema.Struct({
  email: UserSchema.fields.email,
  password: UserSchema.fields.password,
});

const PublicSession = Schema.Struct({
  id: Schema.Trim,
  user: UserSchema.pick("email"),
});

const VerificationCode = Schema.Struct({
  code: Schema.propertySignature(Schema.String).annotations({
    missingMessage: () => "code is required",
  }),
});

export const ResetPassword = Schema.extend(
  ResetPasswordToken.pick("token"),
  UserSchema.pick("password"),
);

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
      .addSuccess(PublicSession)
      .addError(Unauthorized),
  )
  .add(
    HttpApiEndpoint.post("verifyAccount", "/verification-code/verify")
      .setPayload(VerificationCode.pick("code"))
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
      .setPayload(ResetPassword)
      .addError(PasswordResetTokenExpired)
      .addError(PasswordResetTokenNotFound)
      .addSuccess(Schema.Void),
  )
  .prefix("/auth");
