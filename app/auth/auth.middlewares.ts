import { createMiddleware } from "@tanstack/start";
import { getCookie, getEvent, setResponseStatus } from "vinxi/http";
import { validateSessionToken } from "~/auth/auth.services";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { rateLimiter } from "~/libs/rate-limiter";

export const selectSessionTokenMiddleware = createMiddleware()
  .middleware([injectDbMiddleware])
  .server(async ({ next, context }) => {
    const sessionCookie = getCookie("session");

    if (!sessionCookie) {
      return next({
        context: {
          session: null,
        },
      });
    }

    const session = await validateSessionToken(sessionCookie, context.db);

    return next({
      context: {
        session,
      },
    });
  });

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

export const rateLimiterMiddleware = createMiddleware().server(
  async ({ next }) => {
    const headers = getEvent().headers;
    const ip = headers.get("x-forwarded-for") || "localhost";

    const isValid = await rateLimiter.checkRate(ip, 1);

    if (!isValid) {
      setResponseStatus(429);
      throw new Error("Too many requests");
    }

    return await next();
  },
);
