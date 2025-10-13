import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { sessionCookie } from "~/session/session.cookies";
import { sessionService } from "~/session/session.service";
import { HTTPException } from "hono/http-exception";
import type { Ctx } from "~/index";
import type { SessionCtx } from "~/session/session.service";

export const injectSessionMiddleware = createMiddleware<Ctx>(async (c, n) => {
  const token = getCookie(c, sessionCookie.name) ?? "";

  const session = await sessionService.validate(token, c.var.db);

  c.set("session", session);

  await n();
});

type AuthCtx = Ctx &
  Readonly<{
    Variables: Readonly<{
      session: NonNullable<SessionCtx>;
      user: NonNullable<SessionCtx>["user"];
    }>;
  }>;

export const requireAuthMiddleware = createMiddleware<AuthCtx>(async (c, n) => {
  if (!c.var.session) {
    throw new HTTPException(401, { message: "unauthorized" });
  }

  c.set("user", c.var.session.user);

  await n();
});
