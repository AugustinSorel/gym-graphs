import { z } from "zod";

export const userSchema = z.object({
  id: z
    .string({
      required_error: "id is required",
      invalid_type_error: "id must be a uuid",
    })
    .trim()
    .uuid("uuid is not valid"),
  email: z
    .string({ required_error: "email is required" })
    .email({ message: "email must be valid" })
    .min(1, { message: "email must be at leat one charater" })
    .max(255, { message: "email must be at most 255 charaters" }),
  name: z
    .string({ required_error: "name is required" })
    .min(1, { message: "name must be at leat one charater" })
    .max(255, { message: "name must be at most 255 charaters" })
    .nullable(),
});
