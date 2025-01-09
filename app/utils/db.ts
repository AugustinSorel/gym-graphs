import { drizzle } from "drizzle-orm/node-postgres";
import { getDbUrl } from "~/db/db.utils";
import * as schema from "~/db/db.schemas";

export const db = drizzle(getDbUrl(), { schema });

export type Db =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];
