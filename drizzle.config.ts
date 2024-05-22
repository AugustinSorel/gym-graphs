import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  dbCredentials: {
    connectionString: "postgres://postgres:postgres@localhost:5432/gym-graphs",
  },
  out: "./drizzle",
  driver: "pg",
} satisfies Config;
