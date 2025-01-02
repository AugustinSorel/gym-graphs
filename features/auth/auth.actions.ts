import { createServerFn } from "@tanstack/start";
import { createUser, selectUserByEmail } from "~/features/user/user.services";
import { db } from "~/features/utils/db";
import {
  generateSessionToken,
  hashSecret,
  verifySecret,
} from "~/features/auth/auth.services";
import {
  createSession,
  deleteSession,
} from "~/features/session/session.services";
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
} from "~/features/cookie/cookie.services";
import { userSchema } from "~/features/user/user.schemas";
import { z } from "zod";
import pg from "pg";
import { authGuard } from "~/features/auth/auth.middlewares";

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
        const user = await createUser(
          {
            email: data.email,
            password: await hashSecret(data.password),
            name: data.email.split("@").at(0) ?? "anonymous",
          },
          tx,
        );

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

      throw new Error(e);
    }
  });

export const signOutAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .handler(async ({ context }) => {
    await deleteSession(context.session.id, db);
    deleteSessionTokenCookie();
  });
