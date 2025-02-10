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
});
