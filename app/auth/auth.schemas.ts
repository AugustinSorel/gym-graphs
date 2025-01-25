import { z } from "zod";

export const emailVerificationCodeSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
  code: z
    .string({
      required_error: "code is required",
      invalid_type_error: "code must of type string",
    })
    .trim()
    .min(3, "code must be at least 3 characters")
    .max(255, "code must be at most 255 characters"),
});

export const passwordResetTokenSchema = z.object({
  token: z
    .string({
      required_error: "token is required",
      invalid_type_error: "token must of type string",
    })
    .trim()
    .min(3, "token must be at least 3 characters")
    .max(255, "token must be at most 255 characters"),
});
