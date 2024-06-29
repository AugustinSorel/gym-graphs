import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

const config: Config = {
  schema: "./src/server/db/schema.ts",
  dbCredentials: {
    connectionString: process.env.DB_URL!,
  },
  out: "./drizzle",
  driver: "pg",
};

export default config;
