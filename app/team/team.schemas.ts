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
  isPublic: z.boolean({
    required_error: "isPublic is required",
    invalid_type_error: "isPublic must of type boolean",
  }),
});

export const teamsToUsersSchema = z.object({
  role: z.enum(["admin", "member"], {
    required_error: "role is required",
    invalid_type_error: "role must be valid",
  }),
  userId: userSchema.shape.id,
  teamId: teamSchema.shape.id,
});
