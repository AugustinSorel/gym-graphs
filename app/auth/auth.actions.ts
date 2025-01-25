import { createServerFn } from "@tanstack/start";
import {
  createUser,
  seedUserAccount,
  selectUserByEmail,
  updateEmailVerifiedAt,
} from "~/user/user.services";
import { db } from "~/libs/db.lib";
import {
  createEmailVerificationCode,
  createSession,
  deleteEmailVerificationCodeById,
  deleteEmailVerificationCodesByUserId,
  deleteSession,
  deleteSessionByUserId,
  generateEmailVerificationCode,
  generateSessionToken,
  hashSecret,
  selectEmailVerificationCode,
  verifySecret,
} from "~/auth/auth.services";
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
} from "~/auth/auth.cookies";
import { userSchema } from "~/user/user.schemas";
import { z } from "zod";
import pg from "pg";
import {
  authGuardMiddleware,
  selectSessionTokenMiddleware,
} from "~/auth/auth.middlewares";
import { sendVerificationCodeEmail } from "./auth.emails";
import { emailVerificationCodeSchema } from "./auth.schemas";
import { setResponseStatus } from "vinxi/http";
import { isWithinExpirationDate } from "oslo";

export const signInAction = createServerFn()
  .validator(userSchema.pick({ email: true, password: true }))
  .handler(async ({ data }) => {
    const user = await selectUserByEmail(data.email, db);

    if (!user) {
      throw new Error("email or password is invalid");
    }

    if (!user.emailVerifiedAt) {
      throw new Error("email address not verified");
    }

    const validPassword = await verifySecret(data.password, user.password);

    if (!validPassword) {
      throw new Error("email or password is invalid");
    }

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id, db);

    setSessionTokenCookie(sessionToken, session.expiresAt);
  });

export const signUpAction = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        email: userSchema.shape.email,
        password: userSchema.shape.password,
        confirmPassword: userSchema.shape.password,
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      }),
  )
  .handler(async ({ data }) => {
    try {
      await db.transaction(async (tx) => {
        const hashedPassword = await hashSecret(data.password);
        const name = data.email.split("@").at(0) ?? "anonymous";

        const user = await createUser(data.email, hashedPassword, name, tx);

        await seedUserAccount(user.id, tx);

        const emailVerificationCode = generateEmailVerificationCode();
        await createEmailVerificationCode(emailVerificationCode, user.id, tx);
        await sendVerificationCodeEmail(user.email, emailVerificationCode);

        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, user.id, tx);

        setSessionTokenCookie(sessionToken, session.expiresAt);
      });
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateEmail = dbError && e.constraint === "user_email_unique";

      if (duplicateEmail) {
        throw new Error("email is already used");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const signOutAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .handler(async ({ context }) => {
    await deleteSession(context.session.id, db);
    deleteSessionTokenCookie();
  });

export const selectSessionTokenAction = createServerFn({ method: "GET" })
  .middleware([selectSessionTokenMiddleware])
  .handler(({ context }) => {
    return context.session;
  });

export const verifyEmailAction = createServerFn()
  .middleware([authGuardMiddleware])
  .validator(emailVerificationCodeSchema.pick({ code: true }))
  .handler(async ({ context, data }) => {
    return await db.transaction(async (tx) => {
      const emailVerificatonCode = await selectEmailVerificationCode(
        context.user.id,
        tx,
      );

      if (emailVerificatonCode?.code !== data.code) {
        setResponseStatus(401);
        throw new Error("invalid code");
      }

      await deleteEmailVerificationCodeById(emailVerificatonCode.id, tx);

      if (!isWithinExpirationDate(emailVerificatonCode.expiresAt)) {
        throw new Error("code expired");
      }

      if (emailVerificatonCode.user.email !== context.user.email) {
        setResponseStatus(401);
        throw new Error("invalid code");
      }

      await deleteSessionByUserId(context.user.id, tx);

      await updateEmailVerifiedAt(context.user.id, tx);

      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, context.user.id, tx);

      setSessionTokenCookie(sessionToken, session.expiresAt);
    });
  });

export const sendEmailVerificationCodeAction = createServerFn({
  method: "POST",
})
  .middleware([authGuardMiddleware])
  .handler(async ({ context }) => {
    await db.transaction(async (tx) => {
      await deleteEmailVerificationCodesByUserId(context.user.id, tx);

      const emailVerificationCode = generateEmailVerificationCode();

      await createEmailVerificationCode(
        emailVerificationCode,
        context.user.id,
        tx,
      );

      await sendVerificationCodeEmail(
        context.user.email,
        emailVerificationCode,
      );
    });
  });
