import { defineConfig } from "drizzle-kit";
import { getDbUrl } from "~/utils";

const config = defineConfig({
  out: "./drizzle",
  schema: "./src/schemas.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDbUrl(),
  },
});

export default config;
