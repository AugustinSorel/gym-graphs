import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { signUpSchema, signInSchema } from "@gym-graphs/schemas/session";
import { createSessionService } from "~/session/session.service";
import { createSeedUserService, createUserService } from "~/user/user.service";
import { createUserRepo } from "~/user/user.repo";
import { createSessionRepo } from "~/session/session.repo";
import { setCookie } from "hono/cookie";
import { sessionCookieConfig } from "~/session/session.cookies";
import { createEmailService } from "~/email/email.service";
import { createEmailVerificationService } from "~/email-verification/email-verification.service";
import { createEmailVerificationRepo } from "~/email-verification/email-verification.repo";
import { emailVerificationEmailBody } from "~/email-verification/email-verification.emails";
import { HTTPException } from "hono/http-exception";
import type { Ctx } from "~/index";

export const sessionRouter = new Hono<Ctx>();

sessionRouter.post("/sign-up", zValidator("json", signUpSchema), async (c) => {
  const seedUserService = createSeedUserService();
  const emailService = createEmailService(c.var.email);

  const input = c.req.valid("json");

  await c.var.db.transaction(async (tx) => {
    const userService = createUserService(createUserRepo(tx));
    const sessionService = createSessionService(createSessionRepo(tx));
    const emailVerificationService = createEmailVerificationService(
      createEmailVerificationRepo(tx),
    );

    const user = await userService.signUpWithEmailAndPassword(input);

    await seedUserService.seed(user.id);

    const emailVerification = await emailVerificationService.create(user.id);

    const emailBody = emailVerificationEmailBody(emailVerification.code);
    await emailService.sendEmailVerificationCode(user.email, emailBody);

    const session = await sessionService.create(user.id);

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
    const userService = createUserService(createUserRepo(tx));
    const sessionService = createSessionService(createSessionRepo(tx));

    const user = await userService.signInWithEmailAndPassword(input);

    const session = await sessionService.create(user.id);

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

  const sessionService = createSessionService(createSessionRepo(c.var.db));

  await sessionService.delete(c.var.session.id);

  setCookie(
    c,
    sessionCookieConfig.name,
    "",
    sessionCookieConfig.optionsForDeletion,
  );

  return c.json(undefined, 200);
});
