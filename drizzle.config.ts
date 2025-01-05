import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { getDbUrl } from "~/db/db.utils";

const config = defineConfig({
  out: "./drizzle",
  schema: "./features/db/db.schemas.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDbUrl(),
  },
});

export default config;
