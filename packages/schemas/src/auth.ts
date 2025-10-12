import z from "zod";

export const emailVerificationCodeSchema = z.object({
  id: z.number().positive("id must be positive"),
  code: z
    .string()
    .trim()
    .min(3, "code must be at least 3 characters")
    .max(255, "code must be at most 255 characters"),
});

export const passwordResetTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(3, "token must be at least 3 characters")
    .max(255, "token must be at most 255 characters"),
});
