import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { signInSchema } from "@gym-graphs/schemas/session";
import { sessionService } from "~/domains/session/session.service";
import { setCookie } from "hono/cookie";
import { sessionCookie } from "~/domains/session/session.cookies";
import { requireAuthMiddleware } from "~/domains/session/session.middlewares";
import type { Ctx } from "~/index";

export const sessionRouter = new Hono<Ctx>()
  .post("/", zValidator("json", signInSchema), async (c) => {
    const input = c.req.valid("json");

    const session = await sessionService.signIn(input, c.var.db);

    setCookie(
      c,
      sessionCookie.name,
      session.token,
      sessionCookie.optionsForExpiry(session.session.expiresAt),
    );

    return c.json(null, 200);
  })
  .get("/me", requireAuthMiddleware, (c) => {
    return c.json(c.var.session, 200);
  })
  .delete("/me", requireAuthMiddleware, async (c) => {
    await sessionService.signOut(c.var.session.id, c.var.db);

    setCookie(c, sessionCookie.name, "", sessionCookie.optionsForDeletion);

    return c.json(null, 200);
  });
