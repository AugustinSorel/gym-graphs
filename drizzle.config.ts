import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { getDbUrl } from "./db/db";

const config = defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDbUrl(),
  },
});

export default config;
