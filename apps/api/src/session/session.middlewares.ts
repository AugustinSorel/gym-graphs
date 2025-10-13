import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { sessionCookieConfig } from "~/session/session.cookies";
import { sessionService } from "~/session/session.service";
import type { Ctx } from "~/index";

export const injectSessionMiddleware = createMiddleware<Ctx>(async (c, n) => {
  const token = getCookie(c, sessionCookieConfig.name) ?? "";

  const session = await sessionService.validate(token, c.var.db);

  c.set("session", session);

  await n();
});
