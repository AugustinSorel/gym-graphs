import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env.mjs";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const migrationClient = postgres(env.DB_URL, { max: 1 });

void migrate(drizzle(migrationClient), {
  migrationsFolder: "./migration-folder",
});

const client = postgres(env.DB_URL);
export const db = drizzle(client);

