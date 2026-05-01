import { pipe, Schema } from "effect";
import { UserSchema } from "#/user/schemas";

export const SessionSchema = Schema.Struct({
  id: pipe(
    Schema.Trim.annotations({ message: () => "session id must be a valid string" }),
    Schema.nonEmptyString({ message: () => "session id is required" }),
  ),
  userId: UserSchema.fields.id,
  expiresAt: Schema.Date.annotations({ message: () => "expiresAt must be a valid date" }),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export type Session = typeof SessionSchema.Type;
