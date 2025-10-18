import { z } from "zod";
import { userSchema } from "~/user";
import { constant } from "@gym-graphs/constants";

export const teamSchema = z.object({
  id: z.number().positive("id must be positive"),
  name: z
    .string()
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(255, "name must be at most 255 characters"),
  visibility: z.enum(constant.team.visibilities),
});

export const teamMemberSchema = z.object({
  role: z.enum(constant.team.member.roles),
  userId: userSchema.shape.id,
  teamId: teamSchema.shape.id,
});

export const teamInvitationSchema = z.object({
  id: z.number().positive("id must be positive"),
  teamId: teamSchema.shape.id,
  email: z
    .email("email must be valid")
    .trim()
    .min(3, "email must be at least 3 characters")
    .max(255, "email must be at most 255 characters"),
  status: z.enum(constant.team.invitation.statuses),
  token: z
    .string()
    .trim()
    .min(3, "token must be at least 3 characters")
    .max(255, "token must be at most 255 characters"),
});

export const teamJoinRequestSchema = z.object({
  id: z.number().positive("id must be positive"),
  status: z.enum(constant.team.joinRequest.statuses),
});

export const teamEventSchema = z.object({
  id: z.number().positive("id must be positive"),
});

export const teamEventReactionsSchema = z.object({
  teamEventId: teamEventSchema.shape.id,
  emoji: z.enum(constant.team.event.reactions),
});

export const teamNotificationSchema = z.object({
  teamId: teamSchema.shape.id,
});
