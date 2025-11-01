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
});

export const env = envSchema.parse(process.env);
