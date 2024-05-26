import { z } from "zod";
import { muscleGroupsEnum } from "@/db/schema";

export const exerciseSchema = z.object({
  id: z
    .string({
      required_error: "id is required",
      invalid_type_error: "id must be a uuid",
    })
    .uuid("uuid is not valid"),
  exerciseDataId: z
    .string({
      required_error: "id is required",
      invalid_type_error: "id must be a uuid",
    })
    .uuid("uuid is not valid"),
  name: z
    .string({ required_error: "exercise name is required" })
    .min(3, "exercise name must be at least 3 characters long")
    .max(255, "exercise name must be at most 255 characters long"),
  numberOfReps: z
    .number({
      required_error: "number of repetitions is required",
      invalid_type_error: "number of repetitions must be a number",
    })
    .min(1, "number of repetitions must be at least 1")
    .max(200, "number of repetitions must at most 200")
    .int({
      message: "number of repetitions must be an integer",
    }),
  muscleGroups: z.enum(muscleGroupsEnum.enumValues).array(),
});
