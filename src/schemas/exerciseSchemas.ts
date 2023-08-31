import { formatDate } from "@/lib/date";
import { z } from "zod";
import { userId } from "./userSchema";

const exerciseDataId = z
  .string({
    required_error: "id is required",
    invalid_type_error: "id must be a uuid",
  })
  .uuid("uuid is not valid");

const exerciseId = z
  .string({
    required_error: "id is required",
    invalid_type_error: "id must be a uuid",
  })
  .uuid("uuid is not valid");

const name = z
  .string({ required_error: "exercise name is required" })
  .min(3, "exercise name must be at least 3 characters long")
  .max(255, "exercise name must be at most 255 characters long");

const numberOfReps = z
  .number({
    required_error: "number of repetitions is required",
    invalid_type_error: "number of repetitions must be a number",
  })
  .min(1, "number of repetitions must be at least 1")
  .max(200, "number of repetitions must at most 200");

const weightLifted = z
  .number({
    required_error: "weight lifted is required",
    invalid_type_error: "weight lifted must be a number",
  })
  .min(1, "weight lifted must be at least 1kg")
  .max(1000, "weight lifted must be at most 1000 kg");

const date = z
  .date({
    required_error: "date is required",
    invalid_type_error: "date must be a date",
  })
  .min(new Date("1900/01/01"), "date must be after 01/01/1900")
  .max(
    new Date(new Date().setHours(23, 59, 59)),
    `date must before ${formatDate(
      new Date(new Date().setDate(new Date().getDate() + 1))
    )}`
  );

export const newExerciseNameSchema = z.object({ name, userId });

export const deleteExerciseSchema = z.object({ exerciseId });

export const updateExerciseNameSchema = z.object({ name, exerciseId });

export const addExerciseDataSchema = z.object({
  exerciseId,
  numberOfReps,
  weightLifted,
});

export const updateNumberOfRepsSchema = z.object({
  exerciseDataId,
  numberOfReps,
});

export const updateWeightLiftedSchema = z.object({
  exerciseDataId,
  weightLifted,
});

export const updateExerciseDataDateSchema = z.object({
  exerciseDataId,
  date,
});

export const deleteExerciseDataSchema = z.object({
  exerciseDataId,
});

export type DeleteExerciseSchema = z.infer<typeof deleteExerciseSchema>;
export type DeleteExerciseDataSchema = z.infer<typeof deleteExerciseDataSchema>;
export type AddExerciseDataSchema = z.infer<typeof addExerciseDataSchema>;
export type NewExerciseNameSchema = z.infer<typeof newExerciseNameSchema>;
export type UpdateExerciseNameSchema = z.infer<typeof updateExerciseNameSchema>;
export type UpdateNumberOfRepsSchema = z.infer<typeof updateNumberOfRepsSchema>;
export type UpdateWeightLiftedSchema = z.infer<typeof updateWeightLiftedSchema>;
export type UpdateExerciseDataDateSchema = z.infer<
  typeof updateExerciseDataDateSchema
>;
