import { Schema } from "effect";
import { UserSchema } from "#/user/schemas";
import { PasswordResetTokenSchema } from "#/password-reset-token/schemas";

export const SignUpPayload = Schema.Struct({
  email: UserSchema.fields.email,
  password: UserSchema.fields.password,
  confirmPassword: UserSchema.fields.password,
}).pipe(
  Schema.filter((schema) => {
    if (schema.confirmPassword !== schema.password) {
      return {
        path: ["confirmPassword"],
        message: "password don't match",
      };
    }

    return undefined;
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

export const ForgotPassworPayload = UserSchema.pick("email");

export const CurrentSessionSchema = Schema.Struct({
  id: Schema.Trim,
  userId: UserSchema.fields.id,
  user: UserSchema.pick("email", "name", "verifiedAt", "id"),
});
