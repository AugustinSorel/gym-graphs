import { z } from "zod";

export const newExerciseNameSchema = z.object({
  name: z
    .string({ required_error: "new exercise name is required" })
    .min(3, "new exercise name must be at least 3 characters long")
    .max(255, "new exercise name must be at most 255 characters long"),
});
