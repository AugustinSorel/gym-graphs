import { z } from "zod";

export const newExerciseNameSchema = z.object({
  name: z
    .string({ required_error: "exercise name is required" })
    .min(3, "exercise name must be at least 3 characters long")
    .max(255, "exercise name must be at most 255 characters long"),
});
