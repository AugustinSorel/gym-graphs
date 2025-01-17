import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DB_PASSWORD: z.string().trim().nonempty(),
  DB_USER: z.string().trim().nonempty(),
  DB_NAME: z.string().trim().nonempty(),
  DB_HOST: z.string().trim().nonempty(),
  DB_PORT: z.coerce.number(),

  SMTP_HOST: z.string().trim().nonempty(),
  SMTP_USER: z.string().trim().nonempty(),
  SMTP_PASSWORD: z.string().trim().nonempty(),
  SMTP_FROM: z.string().trim().nonempty(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,

  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,
});
