import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { signUpSchema, signInSchema } from "@gym-graphs/schemas/session";
import { sessionService } from "~/session/session.service";
import { setCookie } from "hono/cookie";
import { sessionCookie } from "~/session/session.cookies";
import { emailVerificationService } from "~/email-verification/email-verification.service";
import { emailVerificationEmailBody } from "~/email-verification/email-verification.emails";
import { userService } from "~/user/user.service";
import { seedUserAccount } from "~/user/user.seed";
import { requireAuthMiddleware } from "~/session/session.middlewares";
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

    const config = c.var.email.buildConfig(
      [user.email],
      "Verification code",
      emailVerificationEmailBody(emailVerification.code),
    );

    await c.var.email.client.send(config);

    const session = await sessionService.create(user.id, tx);

    setCookie(
      c,
      sessionCookie.name,
      session.token,
      sessionCookie.optionsForExpiry(session.session.expiresAt),
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
      sessionCookie.name,
      session.token,
      sessionCookie.optionsForExpiry(session.session.expiresAt),
    );
  });

  return c.json(undefined, 200);
});

sessionRouter.post("/sign-out", requireAuthMiddleware, async (c) => {
  await sessionService.revoke(c.var.session.id, c.var.db);

  setCookie(c, sessionCookie.name, "", sessionCookie.optionsForDeletion);

  return c.json(undefined, 200);
});
