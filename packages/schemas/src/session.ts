import z from "zod";
import { userSchema } from "~/user";

export const signUpSchema = z
  .object({
    email: userSchema.shape.email,
    password: userSchema.shape.password,
    confirmPassword: userSchema.shape.password,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignUpSchema = z.infer<typeof signUpSchema>;
