import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "@effect/platform";
import { pipe, Schema } from "effect";
import { DuplicateUser } from "../user/errors";

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

const SignInPayload = Schema.Struct({
  email: UserSchema.fields.email,
  password: UserSchema.fields.password,
  confirmPassword: UserSchema.fields.password,
}).pipe(
  Schema.filter((schema) => schema.confirmPassword === schema.password, {
    message: () => "password don't match",
  }),
);

export const authApi = HttpApiGroup.make("Auth")
  .add(
    HttpApiEndpoint.post("signUp", "/sign-up")
      .setPayload(SignInPayload)
      .addError(HttpApiError.InternalServerError)
      .addError(DuplicateUser)
      .addSuccess(Schema.Void),
  )
  .prefix("/auth");
