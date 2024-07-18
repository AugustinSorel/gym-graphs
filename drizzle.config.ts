import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

const config: Config = {
  schema: "./src/server/db/schema.ts",
  dbCredentials: {
    url: process.env.DB_URL!,
  },
  out: "./drizzle",
  dialect: "postgresql",
};

export default config;
