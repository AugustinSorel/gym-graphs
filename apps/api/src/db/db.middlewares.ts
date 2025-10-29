import { createMiddleware } from "hono/factory";
import { db } from "~/libs/db";
import type { Ctx } from "~/index";

export const injectDbMiddleware = createMiddleware<Ctx>(async (c, n) => {
  c.set("db", db);
  await n();
});
