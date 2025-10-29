import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number(),

  DB_PASSWORD: z.string().trim().min(1, "DB_PASSWORD is required"),
  DB_USER: z.string().trim().min(1, "DB_USER is required"),
  DB_NAME: z.string().trim().min(1, "DB_NAME is required"),
  DB_HOST: z.string().trim().min(1, "DB_HOST is required"),
  DB_PORT: z.coerce.number(),

  SMTP_HOST: z.string().trim().min(1, "SMTP_HOST is required"),
  SMTP_USER: z.string().trim().min(1, "SMTP_USER is required"),
  SMTP_PASSWORD: z.string().trim().min(1, "SMTP_PASSWORD is required"),
  SMTP_FROM: z.string().trim().min(1, "SMTP_FROM is required"),

  GITHUB_CLIENT_ID: z.string().trim().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: z
    .string()
    .trim()
    .min(1, "GITHUB_CLIENT_SECRET is required"),
});

export const env = envSchema.parse(process.env);
