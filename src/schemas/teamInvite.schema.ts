import { z } from "zod";

export const teamInviteSchema = z.object({
  id: z
    .string({
      required_error: "id is required",
      invalid_type_error: "id must be a uuid",
    })
    .trim()
    .uuid("uuid is not valid"),
  token: z
    .string({
      required_error: "token is required",
      invalid_type_error: "token must be a uuid",
    })
    .trim()
    .uuid("token is not valid"),
});
