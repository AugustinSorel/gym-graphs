import { createServerFn } from "@tanstack/start";
import {
  createUser,
  seedUserAccount,
  selectUserByEmail,
} from "~/user/user.services";
import { db } from "~/utils/db";
import {
  generateSessionToken,
  hashSecret,
  verifySecret,
} from "~/auth/auth.services";
import { createSession, deleteSession } from "~/session/session.services";
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
} from "~/cookie/cookie.services";
import { userSchema } from "~/user/user.schemas";
import { z } from "zod";
import pg from "pg";
import { authGuard, validateRequest } from "~/auth/auth.middlewares";

export const validateRequestAction = createServerFn({ method: "GET" })
  .middleware([validateRequest])
  .handler(({ context }) => {
    return {
      user: context.user,
      session: context.session,
    };
  });

export const signInAction = createServerFn()
  .validator(userSchema.pick({ email: true, password: true }))
  .handler(async ({ data }) => {
    const user = await selectUserByEmail(data.email, db);

    if (!user) {
      throw new Error("email or password is invalid");
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
  .middleware([authGuard])
  .handler(async ({ context }) => {
    await deleteSession(context.session.id, db);
    deleteSessionTokenCookie();
  });
