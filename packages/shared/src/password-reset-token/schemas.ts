import { pipe, Schema } from "effect";

export const PasswordResetTokenSchema = Schema.Struct({
  token: pipe(
    Schema.Trim.annotations({
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
});
