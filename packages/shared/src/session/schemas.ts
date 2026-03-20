import { Schema } from "effect";
import { UserSchema } from "#/user/schemas";

export const SessionSchema = Schema.Struct({
  id: Schema.Trim,
  userId: UserSchema.fields.id,
});
