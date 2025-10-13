import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { sessionCookieConfig } from "~/session/session.cookies";
import { createSessionService } from "~/session/session.service";
import { createSessionRepo } from "~/session/session.repo";
import type { Ctx } from "~/index";

export const injectSessionMiddleware = createMiddleware<Ctx>(async (c, n) => {
  const token = getCookie(c, sessionCookieConfig.name) ?? "";

  const sessionService = createSessionService(createSessionRepo(c.var.db));

  const session = await sessionService.validate(token);

  c.set("session", session);

  await n();
});
