import { pipe, Schema } from "effect";

export const VerificationCodeSchema = Schema.Struct({
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
});
