import { defineConfig } from "drizzle-kit";
import { Effect, Redacted } from "effect";
import { serverConfig } from "./src/env";

const env = Effect.runSync(serverConfig);

export default defineConfig({
  out: "./drizzle",
  schema: "./src/integrations/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: Redacted.value(env.db.url),
  },
});
