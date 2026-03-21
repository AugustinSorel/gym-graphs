import { Schema } from "effect";
import { UserSchema } from "#/user/schemas";
import { PasswordResetTokenSchema } from "#/password-reset-token/schemas";

const validatePasswordMatch = <
  T extends { password: string; confirmPassword: string },
>(
  schema: T,
) => {
  if (schema.password !== schema.confirmPassword) {
    return {
      path: ["confirmPassword"],
      message: "Passwords don't match",
    };
  }
  return undefined;
};

export const SignUpPayload = Schema.Struct({
  email: UserSchema.fields.email,
  password: UserSchema.fields.password,
  confirmPassword: UserSchema.fields.password,
}).pipe(Schema.filter(validatePasswordMatch));

export const SignInPayload = Schema.Struct({
  email: UserSchema.fields.email,
  password: UserSchema.fields.password,
});

export const ResetPasswordPayload = Schema.Struct({
  token: PasswordResetTokenSchema.fields.token,
  password: UserSchema.fields.password,
  confirmPassword: UserSchema.fields.password,
}).pipe(Schema.filter(validatePasswordMatch));

export const ForgotPassworPayload = UserSchema.pick("email");

export const CurrentSessionSchema = Schema.Struct({
  id: Schema.Trim,
  userId: UserSchema.fields.id,
  user: UserSchema.pick(
    "email",
    "name",
    "verifiedAt",
    "id",
    "weightUnit",
    "oneRepMaxAlgo",
    "dashboardView",
  ),
});
