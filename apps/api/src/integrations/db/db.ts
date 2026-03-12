import { serverConfig } from "#/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Effect, Redacted } from "effect";

const env = Effect.runSync(serverConfig);

const db = drizzle(Redacted.value(env.db.url));
