import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env.mjs";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const migrationClient = postgres(env.DB_URL, { max: 1 });

try {
  await migrate(drizzle(migrationClient), {
    migrationsFolder: "./migration-folder",
  });
} catch (error) {
  console.log("error in migration", error);
}

const client = postgres(env.DB_URL);
const db = drizzle(client);
