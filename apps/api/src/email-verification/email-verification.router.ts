import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { sessionService } from "~/session/session.service";
import { setCookie } from "hono/cookie";
import { sessionCookieConfig } from "~/session/session.cookies";
import { emailService } from "~/email/email.service";
import { emailVerificationService } from "~/email-verification/email-verification.service";
import { emailVerificationEmailBody } from "~/email-verification/email-verification.emails";
import { HTTPException } from "hono/http-exception";
import { emailVerificationCodeSchema } from "@gym-graphs/schemas/auth";
import type { Ctx } from "~/index";

export const emailVerificationRouter = new Hono<Ctx>();

emailVerificationRouter.post("/", async (c) => {
  const user = c.var.session?.user;

  if (!user) {
    throw new HTTPException(401, { message: "unauthorized" });
  }

  await c.var.db.transaction(async (tx) => {
    const emailVerification = await emailVerificationService.refresh(
      user.id,
      tx,
    );

    const emailBody = emailVerificationEmailBody(emailVerification.code);
    await emailService.sendEmailVerificationCode(
      user.email,
      emailBody,
      c.var.email,
    );
  });

  return c.json(undefined, 200);
});

emailVerificationRouter.post(
  "/confirm",
  zValidator("json", emailVerificationCodeSchema.pick({ code: true })),
  async (c) => {
    const user = c.var.session?.user;
    const input = c.req.valid("json");

    if (!user) {
      throw new HTTPException(401, { message: "unauthorized" });
    }

    await c.var.db.transaction(async (tx) => {
      await emailVerificationService.verifyCode(user.id, input.code, tx);

      const session = await sessionService.refresh(user.id, tx);

      setCookie(
        c,
        sessionCookieConfig.name,
        session.token,
        sessionCookieConfig.optionsForExpiry(session.session.expiresAt),
      );
    });

    return c.json(undefined, 200);
  },
);
