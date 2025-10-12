import { z } from "zod";

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
  weightUnit: z.enum(["kg", "lbs"]),
  password: z
    .string()
    .trim()
    .min(3, "password must be at least 3 characters")
    .max(255, "password must be at most 255 characters"),
  oneRepMaxAlgo: z.enum([
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
  ]),
  dashboardView: z.enum(["graph", "trending"]),
});
