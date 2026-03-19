import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

export class InvalidCredentials extends Schema.TaggedError<InvalidCredentials>()(
  "InvalidCredentials",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Invalid email or password",
    }),
  },
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Unauthorized",
    }),
  },
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class AccountNotVerified extends Schema.TaggedError<AccountNotVerified>()(
  "AccountNotVerified",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Please verify your email before signing in",
    }),
  },
  HttpApiSchema.annotations({ status: 403 }),
) {}

export class DuplicateUser extends Schema.TaggedError<DuplicateUser>()(
  "DuplicateUser",
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 409 }),
) {
  static withEmail(email: string) {
    return new DuplicateUser({
      message: `User with email ${email} already exists`,
    });
  }
}

export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
  "UserNotFound",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "User not found.",
    }),
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class VerificationCodeNotFound extends Schema.TaggedError<VerificationCodeNotFound>()(
  "VerificationCodeNotFound",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Verification code not found. Please request a new code.",
    }),
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class InvalidVerificationCode extends Schema.TaggedError<InvalidVerificationCode>()(
  "InvalidVerificationCode",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Invalid verification code",
    }),
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class VerificationCodeExpired extends Schema.TaggedError<VerificationCodeExpired>()(
  "VerificationCodeExpired",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () =>
        "Verification code has expired. Please request a new code.",
    }),
  },
  HttpApiSchema.annotations({ status: 410 }),
) {}

export class PasswordResetTokenExpired extends Schema.TaggedError<PasswordResetTokenExpired>()(
  "PasswordResetTokenExpired",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () =>
        "Password reset token has expired. Please request a new one.",
    }),
  },
  HttpApiSchema.annotations({ status: 410 }),
) {}

export class PasswordResetTokenNotFound extends Schema.TaggedError<PasswordResetTokenNotFound>()(
  "PasswordResetTokenNotFound",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "password reset token not found.",
    }),
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}
