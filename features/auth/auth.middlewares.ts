import { createMiddleware } from "@tanstack/start";
import { validateSessionToken } from "./auth.services";
import { getCookie } from "vinxi/http";
import { db } from "~/db/db";

export const validateRequest = createMiddleware().server(async ({ next }) => {
  const sessionCookie = getCookie("session");

  if (!sessionCookie) {
    return next({
      context: {
        user: null,
        session: null,
      },
    });
  }

  const { session, user } = await validateSessionToken(sessionCookie, db);

  return next({
    context: {
      user,
      session,
    },
  });
});
