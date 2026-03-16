import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

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
