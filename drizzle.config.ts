import type { Config } from "drizzle-kit";

const config: Config = {
  schema: "./src/db/schema.ts",
  dbCredentials: {
    connectionString: process.env.DB_URL!,
  },
  out: "./drizzle",
  driver: "pg",
};

export default config;
