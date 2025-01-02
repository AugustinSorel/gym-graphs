import { z } from "zod";

export const userSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
  email: z
    .string({
      required_error: "email is required",
      invalid_type_error: "email must of type string",
    })
    .trim()
    .email("email must be valid")
    .min(3, "email must be at least 3 characters")
    .max(255, "email must be at most 255 characters"),
  name: z
    .string({
      required_error: "name is required",
      invalid_type_error: "name must of type string",
    })
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(255, "name must be at most 255 characters"),
  password: z
    .string({
      required_error: "password is required",
      invalid_type_error: "password must of type string",
    })
    .trim()
    .min(3, "password must be at least 3 characters")
    .max(255, "password must be at most 255 characters"),
});
