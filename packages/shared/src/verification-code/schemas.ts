import { pipe, Schema } from "effect";
import { UserSchema } from "#/user/schemas";

export const VerificationCodeSchema = Schema.Struct({
  id: Schema.Positive,
  code: pipe(
    Schema.Trim.annotations({
      message: () => "code must be a valid string",
    }),
    Schema.nonEmptyString({ message: () => "code is required" }),
    Schema.minLength(3, {
      message: () => "code must be at least 3 characters",
    }),
    Schema.maxLength(255, {
      message: () => "code must be at most 255 characters",
    }),
  ),
  userId: UserSchema.fields.id,
  expiresAt: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export type VerificationCode = typeof VerificationCodeSchema.Type;
