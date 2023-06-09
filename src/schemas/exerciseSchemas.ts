import { z } from "zod";

export type NewExerciseNameSchema = z.infer<typeof newExerciseNameSchema>;

export const newExerciseNameSchema = z.object({
  name: z
    .string({ required_error: "exercise name is required" })
    .min(3, "exercise name must be at least 3 characters long")
    .max(255, "exercise name must be at most 255 characters long"),
});

export type AddExerciseDataSchema = z.infer<typeof addExerciseDataSchema>;

export const addExerciseDataSchema = z.object({
  id: z
    .string({
      required_error: "id is required",
      invalid_type_error: "id must be a uuid",
    })
    .uuid("uuid is not valid"),
  numberOfRepetitions: z
    .number({
      required_error: "number of repetitions is required",
      invalid_type_error: "number of repetitions must be a number",
    })
    .min(1, "number of repetitions must be at least 1")
    .max(200, "number of repetitions must at most 200"),
  weightLifted: z
    .number({
      required_error: "weight lifted is required",
      invalid_type_error: "weight lifted must be a number",
    })
    .min(1, "weight lifted must be at least 1kg")
    .max(1000, "weight lifted must be at most 1000 kg"),
});
