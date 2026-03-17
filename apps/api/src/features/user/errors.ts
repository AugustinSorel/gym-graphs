import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

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
