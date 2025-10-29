import { z } from "zod";
import { constant } from "@gym-graphs/constants";

export const userSchema = z.object({
  id: z.number().positive("id must be positive"),
  email: z
    .email("email must be valid")
    .trim()
    .min(3, "email must be at least 3 characters")
    .max(255, "email must be at most 255 characters"),
  name: z
    .string()
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(255, "name must be at most 255 characters"),
  weightUnit: z.enum(constant.user.weightUnit),
  password: z
    .string()
    .trim()
    .min(3, "password must be at least 3 characters")
    .max(255, "password must be at most 255 characters"),
  oneRepMaxAlgo: z.enum(constant.user.oneRepMaxAlgo),
  dashboardView: z.enum(constant.user.dashboardView),
});

export const userPatchSchema = userSchema.partial().pick({
  weightUnit: true,
  name: true,
  oneRepMaxAlgo: true,
  dashboardView: true,
});

export type UserPatch = z.infer<typeof userPatchSchema>;
