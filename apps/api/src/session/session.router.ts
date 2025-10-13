import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { signUpSchema, signInSchema } from "@gym-graphs/schemas/session";
import { sessionService } from "~/session/session.service";
import { setCookie } from "hono/cookie";
import { sessionCookieConfig } from "~/session/session.cookies";
import { emailService } from "~/email/email.service";
import { emailVerificationService } from "~/email-verification/email-verification.service";
import { emailVerificationEmailBody } from "~/email-verification/email-verification.emails";
import { HTTPException } from "hono/http-exception";
import { userService } from "~/user/user.service";
import { seedUserAccount } from "~/user/user.seed";
import type { Ctx } from "~/index";

export const sessionRouter = new Hono<Ctx>();

sessionRouter.post("/sign-up", zValidator("json", signUpSchema), async (c) => {
  const input = c.req.valid("json");

  await c.var.db.transaction(async (tx) => {
    const user = await userService.signUpWithEmailAndPassword(input, tx);

    await seedUserAccount(user.id);

    const emailVerification = await emailVerificationService.create(
      user.id,
      tx,
    );

    const emailBody = emailVerificationEmailBody(emailVerification.code);
    await emailService.sendEmailVerificationCode(
      user.email,
      emailBody,
      c.var.email,
    );

    const session = await sessionService.create(user.id, tx);

    setCookie(
      c,
      sessionCookieConfig.name,
      session.token,
      sessionCookieConfig.optionsForExpiry(session.session.expiresAt),
    );
  });

  return c.json(undefined, 200);
});

sessionRouter.post("/sign-in", zValidator("json", signInSchema), async (c) => {
  const input = c.req.valid("json");

  await c.var.db.transaction(async (tx) => {
    const user = await userService.signInWithEmailAndPassword(input, tx);

    const session = await sessionService.create(user.id, tx);

    setCookie(
      c,
      sessionCookieConfig.name,
      session.token,
      sessionCookieConfig.optionsForExpiry(session.session.expiresAt),
    );
  });

  return c.json(undefined, 200);
});

sessionRouter.post("/sign-out", async (c) => {
  if (!c.var.session) {
    throw new HTTPException(401, { message: "unauthorized" });
  }

  await sessionService.revoke(c.var.session.id, c.var.db);

  setCookie(
    c,
    sessionCookieConfig.name,
    "",
    sessionCookieConfig.optionsForDeletion,
  );

  return c.json(undefined, 200);
});
