import { z } from "zod";
import { userSchema } from "~/user";

export const exerciseSchema = z.object({
  id: z.number().positive("id must be positive"),
  userId: userSchema.shape.id,
});
