import z from "zod";
import { userSchema } from "~/user";

export const passwordResetTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(3, "token must be at least 3 characters")
    .max(255, "token must be at most 255 characters"),
});

export const passwordResetResetSchema = z
  .object({
    password: userSchema.shape.password,
    confirmPassword: userSchema.shape.password,
    token: passwordResetTokenSchema.shape.token,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordResetResetSchema = z.infer<typeof passwordResetResetSchema>;
