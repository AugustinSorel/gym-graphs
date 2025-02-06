import { z } from "zod";
import { exerciseSchema } from "~/exercise/exericse.schemas";

export const tileSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
  type: z.enum(
    [
      "exercise",
      "exercisesFrequency",
      "tagsFrequency",
      "exercisesFunFacts",
      "setsHeatMap",
    ],
    {
      required_error: "type is required",
      invalid_type_error: "type must be valid",
    },
  ),
  exerciseId: exerciseSchema.shape.id.nullable(),
});
