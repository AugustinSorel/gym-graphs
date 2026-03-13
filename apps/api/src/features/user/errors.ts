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
