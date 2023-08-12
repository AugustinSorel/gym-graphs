import { env } from "@/env.mjs";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  dbCredentials:{
    connectionString:env.DB_URL
  },
  out: "./drizzle",
} satisfies Config;
