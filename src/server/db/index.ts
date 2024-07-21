import { env } from "@/env.js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const connectionString = env.DB_URL;
const sql = postgres(connectionString, { max: 1 });
export const db = drizzle(sql, {
  schema: { ...schema, ...relations },
  logger: env.NODE_ENV === "development",
});

export type Db = typeof db;
