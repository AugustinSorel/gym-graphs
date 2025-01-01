import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "~/features/db/db.schemas";
import { env } from "~/env";

export const getDbUrl = () => {
  return `postgresql://${env.DB_USER}:${env.DB_PASSWORD!}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
};

export const db = drizzle(getDbUrl(), { schema });

export type Db =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];
