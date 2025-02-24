import { createServerFn } from "@tanstack/start";
import {
  createUserWithEmailAndPassword,
  seedUserAccount,
  selectUserByEmail,
  updateEmailVerifiedAt,
  updatePassword,
} from "~/user/user.services";
import {
  createEmailVerificationCode,
  createPasswordResetToken,
  createSession,
  deleteEmailVerificationCodeById,
  deleteEmailVerificationCodesByUserId,
  deletePasswordResetTokenByToken,
  deletePasswordResetTokenByUserId,
  deleteSession,
  deleteSessionByUserId,
  generateEmailVerificationCode,
  generateGithubOauthToken,
  generateGithubOauthUrl,
  generatePasswordResetToken,
  generateSessionToken,
  hashSecret,
  selectEmailVerificationCode,
  selectPasswordResetToken,
  sha256Encode,
  verifySecret,
} from "~/auth/auth.services";
import {
  deleteSessionTokenCookie,
  setGithubTokenCookie,
  setSessionTokenCookie,
} from "~/auth/auth.cookies";
import { userSchema } from "~/user/user.schemas";
import { z } from "zod";
import pg from "pg";
import {
  authGuardMiddleware,
  rateLimiterMiddleware,
  selectSessionTokenMiddleware,
} from "~/auth/auth.middlewares";
import {
  sendResetPasswordEmail,
  sendVerificationCodeEmail,
} from "~/auth/auth.emails";
import {
  emailVerificationCodeSchema,
  passwordResetTokenSchema,
} from "~/auth/auth.schemas";
import { setResponseStatus } from "vinxi/http";
import { isWithinExpirationDate } from "oslo";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { inferNameFromEmail } from "~/user/user.utils";
import { env } from "~/env";

export const signInAction = createServerFn()
  .middleware([rateLimiterMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ email: true, password: true }))
  .handler(async ({ data, context }) => {
    const user = await selectUserByEmail(data.email, context.db);

    if (!user) {
      throw new Error("email or password is invalid");
    }

    if (!user.emailVerifiedAt) {
      throw new Error("email address not verified");
    }

    if (!user.password) {
      throw new Error("this account has been set up using oauth");
    }

    const validPassword = await verifySecret(data.password, user.password);

    if (!validPassword) {
      throw new Error("email or password is invalid");
    }

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id, context.db);

    setSessionTokenCookie(sessionToken, session.expiresAt);
  });

export const signUpAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, injectDbMiddleware])
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
  .handler(async ({ data, context }) => {
    try {
      await context.db.transaction(async (tx) => {
        const hashedPassword = await hashSecret(data.password);
        const name = inferNameFromEmail(data.email);

        const user = await createUserWithEmailAndPassword(
          data.email,
          hashedPassword,
          name,
          tx,
        );

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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    await deleteSession(context.session.id, context.db);
    deleteSessionTokenCookie();
  });

export const selectSessionTokenAction = createServerFn({ method: "GET" })
  .middleware([rateLimiterMiddleware, selectSessionTokenMiddleware])
  .handler(({ context }) => {
    return context.session;
  });

export const verifyEmailAction = createServerFn()
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(emailVerificationCodeSchema.pick({ code: true }))
  .handler(async ({ context, data }) => {
    return await context.db.transaction(async (tx) => {
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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    await context.db.transaction(async (tx) => {
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

export const githubSignInAction = createServerFn({ method: "POST" })
  .validator(z.object({ callbackUrl: z.string().nullish() }).optional())
  .handler(async ({ data }) => {
    const token = generateGithubOauthToken();

    const url = generateGithubOauthUrl(token);

    if (data?.callbackUrl) {
      url.searchParams.set(
        "redirect_uri",
        `${env.APP_URL}/api/auth/callback/github?callbackUrl=${data.callbackUrl}`,
      );
    }

    setGithubTokenCookie(token);

    return url.toString();
  });

export const requestResetPasswordAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ email: true }))
  .handler(async ({ data, context }) => {
    return await context.db.transaction(async (tx) => {
      const user = await selectUserByEmail(data.email, tx);

      if (!user) {
        setResponseStatus(404);
        throw new Error("user not found");
      }

      await deletePasswordResetTokenByUserId(user.id, tx);

      const token = generatePasswordResetToken();
      const tokenHash = await sha256Encode(token);

      await createPasswordResetToken(tokenHash, user.id, tx);

      await sendResetPasswordEmail(user.email, token);
    });
  });

export const resetPasswordAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, injectDbMiddleware])
  .validator(
    z
      .object({
        password: userSchema.shape.password,
        confirmPassword: userSchema.shape.password,
        token: passwordResetTokenSchema.shape.token,
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      }),
  )
  .handler(async ({ data, context }) => {
    return context.db.transaction(async (tx) => {
      const tokenHash = await sha256Encode(data.token);

      const [token] = await selectPasswordResetToken(tokenHash, tx);

      if (token) {
        await deletePasswordResetTokenByToken(tokenHash, tx);
      }

      if (!token) {
        setResponseStatus(404);
        throw new Error("token not found");
      }

      if (!isWithinExpirationDate(token.expiresAt)) {
        throw new Error("token expired");
      }

      await deleteSessionByUserId(token.userId, tx);
      const passwordHash = await hashSecret(data.password);

      await updatePassword(passwordHash, token.userId, tx);

      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, token.userId, tx);

      setSessionTokenCookie(sessionToken, session.expiresAt);
    });
  });
