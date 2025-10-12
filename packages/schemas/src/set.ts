import z from "zod";
import { exerciseSchema } from "~/exercise";

export const setSchema = z.object({
  id: z.number().positive("id must be positive"),
  exerciseId: exerciseSchema.shape.id,
  weightInKg: z
    .number()
    .positive("weight lifted must be above 0")
    .max(2000, "weight lifted must be below 2000"),
  repetitions: z
    .number()
    .positive("repetition count must be above 0")
    .max(1000, "repetition count must be below 1000"),
  doneAt: z
    .date()
    .min(
      new Date("01/01/1900"),
      `done at cannot be less than ${new Date("01/01/1900").toLocaleDateString()}`,
    )
    .max(
      new Date(),
      `done at cannot be after the ${new Date().toLocaleDateString()}`,
    ),
});
