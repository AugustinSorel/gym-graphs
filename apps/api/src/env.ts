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

  CACHE_PASSWORD: z.string().trim().nonempty(),
  CACHE_USER: z.string().trim().nonempty(),
  CACHE_HOST: z.string().trim().nonempty(),
  CACHE_NAME: z.coerce.number(),
  CACHE_PORT: z.coerce.number(),

  SMTP_HOST: z.string().trim().nonempty(),
  SMTP_USER: z.string().trim().nonempty(),
  SMTP_PASSWORD: z.string().trim().nonempty(),
  SMTP_FROM: z.string().trim().nonempty(),

  GITHUB_CLIENT_ID: z.string().trim().nonempty(),
  GITHUB_CLIENT_SECRET: z.string().trim().nonempty(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,

  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,

  CACHE_PASSWORD: process.env.CACHE_PASSWORD,
  CACHE_USER: process.env.CACHE_USER,
  CACHE_HOST: process.env.CACHE_HOST,
  CACHE_NAME: process.env.CACHE_NAME,
  CACHE_PORT: process.env.CACHE_PORT,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,

  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
});
