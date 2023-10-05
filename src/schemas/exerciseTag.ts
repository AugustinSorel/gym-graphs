import { z } from "zod";

export const exerciseTags = [
  "legs",
  "chest",
  "biceps",
  "triceps",
  "back",
  "shoulders",
  "calfs",
  "abs",
  "traps",
] as const;

const exerciseTagEnum = z.enum(exerciseTags);

export type ExerciseTag = z.infer<typeof exerciseTagEnum>;
