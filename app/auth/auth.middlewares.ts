import { createMiddleware } from "@tanstack/start";
import { validateSessionToken } from "./auth.services";
import { getCookie, setResponseStatus } from "vinxi/http";
import { db } from "~/utils/db";

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

export const authGuard = createMiddleware()
  .middleware([validateRequest])
  .server(async ({ next, context }) => {
    if (!context.user || !context.session) {
      setResponseStatus(401);

      throw new Error("unauthorized");
    }

    return next({
      context: {
        user: context.user,
        session: context.session,
      },
    });
  });
