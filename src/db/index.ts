import { env } from "@/env.mjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = env.DB_URL;
const sql = postgres(connectionString, { max: 1 });
export const db = drizzle(sql);
