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

export const teamInvitationSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
  teamId: teamSchema.shape.id,
  email: z
    .string({
      required_error: "email is required",
      invalid_type_error: "email must of type string",
    })
    .trim()
    .email("email must be valid")
    .min(3, "email must be at least 3 characters")
    .max(255, "email must be at most 255 characters"),
  status: z.enum(["pending", "accepted", "expired", "revoked"], {
    required_error: "status is required",
    invalid_type_error: "status must be valid",
  }),
  token: z
    .string({
      required_error: "token is required",
      invalid_type_error: "token must of type string",
    })
    .trim()
    .min(3, "token must be at least 3 characters")
    .max(255, "token must be at most 255 characters"),
});

export const teamJoinRequestSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
  status: z.enum(["pending", "accepted", "rejected"], {
    required_error: "status is required",
    invalid_type_error: "status must be valid",
  }),
});

export const teamEventSchema = z.object({
  id: z
    .number({
      required_error: "id is required",
      invalid_type_error: "id must of type number",
    })
    .positive("id must be positive"),
});

export const teamEventReactionsSchema = z.object({
  teamEventId: teamEventSchema.shape.id,
  emoji: z.enum(["🎯", "😤", "🔥", "🎉", "💪"], {
    required_error: "emoji is required",
    invalid_type_error: "emoji must be valid",
  }),
});

export const teamNotificationSchema = z.object({
  teamId: teamSchema.shape.id,
});
