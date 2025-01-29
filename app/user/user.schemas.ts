import { z } from "zod";
import { exerciseSchema } from "~/exercise/exericse.schemas";

export const userSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
  email: z
    .string({
      required_error: "email is required",
      invalid_type_error: "email must of type string",
    })
    .trim()
    .email("email must be valid")
    .min(3, "email must be at least 3 characters")
    .max(255, "email must be at most 255 characters"),
  name: z
    .string({
      required_error: "name is required",
      invalid_type_error: "name must of type string",
    })
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(255, "name must be at most 255 characters"),
  weightUnit: z.enum(["kg", "lbs"], {
    required_error: "weight unit is required",
    invalid_type_error: "weight unit must be valid",
  }),
  password: z
    .string({
      required_error: "password is required",
      invalid_type_error: "password must of type string",
    })
    .trim()
    .min(3, "password must be at least 3 characters")
    .max(255, "password must be at most 255 characters"),
  oneRepMaxAlgo: z.enum(
    [
      "adams",
      "baechle",
      "berger",
      "brown",
      "brzycki",
      "epley",
      "kemmler",
      "landers",
      "lombardi",
      "mayhew",
      "naclerio",
      "oConner",
      "wathen",
    ],
    {
      required_error: "one rep max algo is required",
      invalid_type_error: "one rep max algo must be valid",
    },
  ),
});

export const dashboardTileSchema = z.object({
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
  exerciseId: z.number().nullable(),
});
