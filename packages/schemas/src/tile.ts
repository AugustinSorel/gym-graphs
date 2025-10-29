import { z } from "zod";
import { exerciseSchema } from "~/exercise";
import { constant } from "@gym-graphs/constants";

export const tileSchema = z.object({
  id: z.number().positive("id must be positive"),
  type: z.enum(constant.dashboard.tile.types),
  exerciseId: exerciseSchema.shape.id.nullable(),
  name: z
    .string()
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(255, "name must be at most 255 characters"),
});
