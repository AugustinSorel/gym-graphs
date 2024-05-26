import { formatDate } from "@/lib/date";
import { z } from "zod";

export const exerciseDataSchema = z.object({
  id: z
    .string({
      required_error: "id is required",
      invalid_type_error: "id must be a uuid",
    })
    .uuid("uuid is not valid"),
  exerciseId: z
    .string({
      required_error: "exercise id is required",
      invalid_type_error: "exercise id must be a uuid",
    })
    .uuid("uuid is not valid"),
  numberOfRepetitions: z
    .number({
      required_error: "number of repetitions is required",
      invalid_type_error: "number of repetitions must be a number",
    })
    .min(1, "number of repetitions must be at least 1")
    .max(200, "number of repetitions must at most 200")
    .int({
      message: "number of repetitions must be an integer",
    }),
  weightLifted: z
    .number({
      required_error: "weight lifted is required",
      invalid_type_error: "weight lifted must be a number",
    })
    .min(1, "weight lifted must be at least 1kg")
    .max(1000, "weight lifted must be at most 1000 kg"),
  doneAt: z
    .string()
    .date("done at date must be a valide string date")
    .refine((dateStr) => {
      return new Date(dateStr).getTime() > new Date("1900-01-01").getTime();
    }, "done at date must be after 01/01/1900")
    .refine(
      (dateStr) => {
        return (
          new Date(dateStr).getTime() <
          new Date(new Date().setHours(23, 59, 59)).getTime()
        );
      },
      `date must before ${formatDate(
        new Date(new Date().setDate(new Date().getDate() + 1)),
      )}`,
    ),
});
