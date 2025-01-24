import { createMiddleware } from "@tanstack/start";
import { getCookie, setResponseStatus } from "vinxi/http";
import { validateSessionToken } from "~/auth/auth.services";
import { db } from "~/libs/db.lib";

export const selectSessionTokenMiddleware = createMiddleware().server(
  async ({ next }) => {
    const sessionCookie = getCookie("session");

    if (!sessionCookie) {
      return next({
        context: {
          session: null,
        },
      });
    }

    const session = await validateSessionToken(sessionCookie, db);

    return next({
      context: {
        session,
      },
    });
  },
);

export const authGuardMiddleware = createMiddleware()
  .middleware([selectSessionTokenMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session) {
      setResponseStatus(401);
      throw new Error("unauthorized");
    }

    return next({
      context: {
        session: context.session,
        user: context.session.user,
      },
    });
  });
