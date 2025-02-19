import { z } from "zod";

export const teamSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
  name: z
    .string({
      required_error: "name is required",
      invalid_type_error: "name must of type string",
    })
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(255, "name must be at most 255 characters"),
  isPublic: z.boolean({
    required_error: "isPublic is required",
    invalid_type_error: "isPublic must of type boolean",
  }),
});
