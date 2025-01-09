import { z } from "zod";
import { userSchema } from "~/user/user.schemas";

export const exerciseSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
  userId: userSchema.shape.id,
  name: z
    .string({
      required_error: "name is required",
      invalid_type_error: "name must of type string",
    })
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(255, "name must be at most 255 characters"),
});
