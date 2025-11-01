import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number(),

  SMTP_HOST: z.string().trim().nonempty(),
  SMTP_USER: z.string().trim().nonempty(),
  SMTP_PASSWORD: z.string().trim().nonempty(),
  SMTP_FROM: z.string().trim().nonempty(),

  GITHUB_CLIENT_ID: z.string().trim().nonempty(),
  GITHUB_CLIENT_SECRET: z.string().trim().nonempty(),
});

export const env = envSchema.parse(process.env);
