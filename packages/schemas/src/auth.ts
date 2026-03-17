import { Schema } from "effect";
import { UserSchema } from "./user";
import { PasswordResetTokenSchema } from "./password-reset-token";

export const SignUpPayload = Schema.Struct({
  email: UserSchema.fields.email,
  password: UserSchema.fields.password,
  confirmPassword: UserSchema.fields.password,
}).pipe(
  Schema.filter((schema) => schema.confirmPassword === schema.password, {
    message: () => "password don't match",
  }),
);

export const SignInPayload = Schema.Struct({
  email: UserSchema.fields.email,
  password: UserSchema.fields.password,
});

export const ResetPasswordPayload = Schema.extend(
  PasswordResetTokenSchema.pick("token"),
  UserSchema.pick("password"),
);

export const CurrentSession = Schema.Struct({
  id: Schema.Trim,
  userId: UserSchema.fields.id,
  user: UserSchema.pick("email", "name", "verifiedAt"),
});
