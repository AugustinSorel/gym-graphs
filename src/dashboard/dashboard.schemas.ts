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
      "tilesToSetsCount",
      "tilesToTagsCount",
      "tilesSetsHeatMap",
      "tilesFunFacts",
    ],
    {
      required_error: "type is required",
      invalid_type_error: "type must be valid",
    },
  ),
  exerciseId: exerciseSchema.shape.id.nullable(),
  name: z
    .string({
      required_error: "name is required",
      invalid_type_error: "name must of type string",
    })
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(255, "name must be at most 255 characters"),
});

export const dashboardViewSchema = z.enum(["grid", "list"]);
