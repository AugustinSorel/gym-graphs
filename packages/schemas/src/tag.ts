import z from "zod";

export const tagSchema = z.object({
  id: z.number().positive("id must be positive"),
  name: z
    .string()
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(255, "name must be at most 255 characters"),
});
