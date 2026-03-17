import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

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
