import type { Config } from "drizzle-kit";
import { env } from "@/env.js";

const config: Config = {
  schema: "./src/server/db/schema.ts",
  dbCredentials: {
    url: env.DB_URL,
  },
  out: "./drizzle",
  dialect: "postgresql",
};

export default config;
