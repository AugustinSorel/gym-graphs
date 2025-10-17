import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const env = envSchema.parse(process.env);

export const constant = {
  url: {
    api:
      env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : "https://api.gym-graphs.com",
    web:
      env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://gym-graphs.com",
  },
  cookie: {
    session: "session",
  },
} as const;
