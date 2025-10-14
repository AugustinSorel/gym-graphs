import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie } from "hono/cookie";
import { sessionCookie } from "~/session/session.cookies";
import { emailVerificationService } from "~/email-verification/email-verification.service";
import { emailVerificationCodeSchema } from "@gym-graphs/schemas/email-verification";
import { requireAuthMiddleware } from "~/session/session.middlewares";
import type { Ctx } from "~/index";

export const emailVerificationRouter = new Hono<Ctx>();

emailVerificationRouter.post("/", requireAuthMiddleware, async (c) => {
  await emailVerificationService.create(c.var.user, c.var.db, c.var.email);

  return c.json(undefined, 200);
});

emailVerificationRouter.post(
  "/confirm",
  requireAuthMiddleware,
  zValidator("json", emailVerificationCodeSchema.pick({ code: true })),
  async (c) => {
    const input = c.req.valid("json");

    const session = await emailVerificationService.confirm(
      c.var.user.id,
      input.code,
      c.var.db,
    );

    setCookie(
      c,
      sessionCookie.name,
      session.token,
      sessionCookie.optionsForExpiry(session.session.expiresAt),
    );

    return c.json(undefined, 200);
  },
);
