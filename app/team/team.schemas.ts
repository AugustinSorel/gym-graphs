import { z } from "zod";
import { userSchema } from "~/user/user.schemas";

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
  visibility: z.enum(["public", "private"], {
    required_error: "visibility is required",
    invalid_type_error: "visibility must be valid",
  }),
});

export const teamMemberSchema = z.object({
  role: z.enum(["admin", "member"], {
    required_error: "role is required",
    invalid_type_error: "role must be valid",
  }),
  userId: userSchema.shape.id,
  teamId: teamSchema.shape.id,
});
