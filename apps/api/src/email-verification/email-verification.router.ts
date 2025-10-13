import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { sessionService } from "~/session/session.service";
import { setCookie } from "hono/cookie";
import { sessionCookie } from "~/session/session.cookies";
import { emailVerificationService } from "~/email-verification/email-verification.service";
import { emailVerificationEmailBody } from "~/email-verification/email-verification.emails";
import { emailVerificationCodeSchema } from "@gym-graphs/schemas/auth";
import { requireAuthMiddleware } from "~/session/session.middlewares";
import type { Ctx } from "~/index";

export const emailVerificationRouter = new Hono<Ctx>();

emailVerificationRouter.post("/", requireAuthMiddleware, async (c) => {
  await c.var.db.transaction(async (tx) => {
    const emailVerification = await emailVerificationService.refresh(
      c.var.user.id,
      tx,
    );

    const config = c.var.email.buildConfig(
      [c.var.user.email],
      "Verification code",
      emailVerificationEmailBody(emailVerification.code),
    );

    await c.var.email.client.send(config);
  });

  return c.json(undefined, 200);
});

emailVerificationRouter.post(
  "/confirm",
  requireAuthMiddleware,
  zValidator("json", emailVerificationCodeSchema.pick({ code: true })),
  async (c) => {
    const input = c.req.valid("json");

    await c.var.db.transaction(async (tx) => {
      await emailVerificationService.verifyCode(c.var.user.id, input.code, tx);

      const session = await sessionService.refresh(c.var.user.id, tx);

      setCookie(
        c,
        sessionCookie.name,
        session.token,
        sessionCookie.optionsForExpiry(session.session.expiresAt),
      );
    });

    return c.json(undefined, 200);
  },
);
