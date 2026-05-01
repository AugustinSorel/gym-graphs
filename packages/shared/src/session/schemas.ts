import { Schema } from "effect";
import { UserSchema } from "#/user/schemas";

export const SessionSchema = Schema.Struct({
  id: Schema.Trim,
  userId: UserSchema.fields.id,
  expiresAt: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export type Session = typeof SessionSchema.Type;
