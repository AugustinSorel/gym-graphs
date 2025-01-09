import { z } from "zod";
import { exerciseSchema } from "~/exercise/exericse.schemas";

export const exerciseSetSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
  exerciseId: exerciseSchema.shape.id,
  weightInKg: z
    .number({
      required_error: "weight lifted is required",
      invalid_type_error: "weight lifted must of type number",
    })
    .positive("weight lifted must be above 0")
    .max(2000, "weight lifted must be below 2000"),
  repetitions: z
    .number({
      required_error: "repetition count is required",
      invalid_type_error: "reptition count must of type number",
    })
    .positive("repetition count must be above 0")
    .max(1000, "repetition count must be below 1000"),
  doneAt: z
    .date({
      required_error: "done at is required",
      invalid_type_error: "done at must of type date",
    })
    .min(
      new Date("01/01/1900"),
      `done at cannot be less than ${new Date("01/01/1900").toLocaleDateString()}`,
    )
    .max(
      new Date(),
      `done at cannot be after the ${new Date().toLocaleDateString()}`,
    ),
});
