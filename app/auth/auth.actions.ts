import { createServerFn } from "@tanstack/react-start";
import {
  createUserWithEmailAndPassword,
  seedUserAccount,
  selectUserByEmail,
  updateEmailVerifiedAt,
  updatePasswordAndSalt,
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
  generatePasswordResetToken,
  generateSalt,
  generateSessionToken,
  hashSecret,
  selectEmailVerificationCode,
  selectPasswordResetToken,
  hashSHA256Hex,
  verifySecret,
} from "~/auth/auth.services";
import {
  deleteSessionTokenCookie,
  setGithubStateCookie,
  setSessionTokenCookie,
} from "~/auth/auth.cookies";
import { userSchema } from "~/user/user.schemas";
import { z } from "zod";
import {
  authGuardMiddleware,
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
import { injectDbMiddleware } from "~/db/db.middlewares";
import { inferNameFromEmail } from "~/user/user.utils";
import {
  generateGithubOAuthUrl,
  generateOAuthState,
} from "~/auth/oauth.services";
import {
  AuthAccountMissingCredentialsError,
  AuthEmailNotVerifiedError,
  AuthInvalidCredentialsError,
  EmailVerificationCodeExpiredError,
  EmailVerificationCodeInvalidError,
  PasswordResetTokenExpiredError,
  PasswordResetTokenNotFoundError,
} from "~/auth/auth.errors";
import { UserNotFoundError } from "~/user/user.errors";

export const signInAction = createServerFn()
  .middleware([injectDbMiddleware])
  .validator(userSchema.pick({ email: true, password: true }))
  .handler(async ({ data, context }) => {
    const user = await selectUserByEmail(data.email, context.db);

    if (!user) {
      throw new AuthInvalidCredentialsError();
    }

    if (!user.emailVerifiedAt) {
      throw new AuthEmailNotVerifiedError();
    }

    if (!user.password || !user.salt) {
      throw new AuthAccountMissingCredentialsError();
    }

    const validPassword = await verifySecret(
      data.password,
      user.password,
      user.salt,
    );

    if (!validPassword) {
      throw new AuthInvalidCredentialsError();
    }

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id, context.db);

    setSessionTokenCookie(sessionToken, session.expiresAt);
  });

export const signUpAction = createServerFn({ method: "POST" })
  .middleware([injectDbMiddleware])
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
    await context.db.transaction(async (tx) => {
      const salt = generateSalt();
      const hashedPassword = await hashSecret(data.password, salt);
      const name = inferNameFromEmail(data.email);

      const user = await createUserWithEmailAndPassword(
        data.email,
        hashedPassword,
        salt,
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
  });

export const signOutAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    await deleteSession(context.session.id, context.db);
    deleteSessionTokenCookie();
  });

export const selectSessionTokenAction = createServerFn({ method: "GET" })
  .middleware([selectSessionTokenMiddleware])
  .handler(({ context }) => {
    return context.session;
  });

export const verifyEmailAction = createServerFn()
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(emailVerificationCodeSchema.pick({ code: true }))
  .handler(async ({ context, data }) => {
    await context.db.transaction(async (tx) => {
      const emailVerificatonCode = await selectEmailVerificationCode(
        context.user.id,
        tx,
      );

      if (emailVerificatonCode?.code !== data.code) {
        throw new EmailVerificationCodeInvalidError();
      }

      await deleteEmailVerificationCodeById(emailVerificatonCode.id, tx);

      const codeExpired =
        Date.now() >= emailVerificatonCode.expiresAt.getTime();

      if (codeExpired) {
        throw new EmailVerificationCodeExpiredError();
      }

      if (emailVerificatonCode.user.email !== context.user.email) {
        throw new EmailVerificationCodeInvalidError();
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
  .middleware([authGuardMiddleware, injectDbMiddleware])
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
  .validator(z.object({ callbackUrl: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const state = generateOAuthState();

    const url = generateGithubOAuthUrl(
      state,
      ["user:email"],
      data?.callbackUrl,
    );

    setGithubStateCookie(state);

    return url.toString();
  });

export const requestResetPasswordAction = createServerFn({ method: "POST" })
  .middleware([injectDbMiddleware])
  .validator(userSchema.pick({ email: true }))
  .handler(async ({ data, context }) => {
    await context.db.transaction(async (tx) => {
      const user = await selectUserByEmail(data.email, tx);

      if (!user) {
        throw new UserNotFoundError();
      }

      await deletePasswordResetTokenByUserId(user.id, tx);

      const token = generatePasswordResetToken();
      const tokenHash = hashSHA256Hex(token);

      await createPasswordResetToken(tokenHash, user.id, tx);

      await sendResetPasswordEmail(user.email, token);
    });
  });

export const resetPasswordAction = createServerFn({ method: "POST" })
  .middleware([injectDbMiddleware])
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
    await context.db.transaction(async (tx) => {
      const tokenHash = hashSHA256Hex(data.token);

      const [token] = await selectPasswordResetToken(tokenHash, tx);

      if (token) {
        await deletePasswordResetTokenByToken(tokenHash, tx);
      }

      if (!token) {
        throw new PasswordResetTokenNotFoundError();
      }

      const codeExpired = Date.now() >= token.expiresAt.getTime();

      if (codeExpired) {
        throw new PasswordResetTokenExpiredError();
      }

      await deleteSessionByUserId(token.userId, tx);

      const salt = generateSalt();
      const passwordHash = await hashSecret(data.password, salt);

      await updatePasswordAndSalt(passwordHash, salt, token.userId, tx);

      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, token.userId, tx);

      setSessionTokenCookie(sessionToken, session.expiresAt);
    });
  });
