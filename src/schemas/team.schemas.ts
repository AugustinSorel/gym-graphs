import { z } from "zod";

export const teamSchema = z.object({
  id: z
    .string({
      required_error: "id is required",
      invalid_type_error: "id must be a uuid",
    })
    .trim()
    .uuid("uuid is not valid"),
  name: z
    .string({ required_error: "team name is required" })
    .trim()
    .min(3, "team name must be at least 3 characters long")
    .max(255, "team name must be at most 255 characters long"),
});
