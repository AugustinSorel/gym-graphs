import { getCookie, getHeader } from "@tanstack/react-start/server";
import { createMiddleware } from "@tanstack/react-start";
import { validateSessionToken } from "~/auth/auth.services";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { env } from "~/env";
import { rateLimiter } from "~/libs/rate-limiter";
import { TooManyRequestsError, UnauthorizedError } from "~/auth/auth.errors";

export const selectSessionTokenMiddleware = createMiddleware({
  type: "function",
})
  .middleware([injectDbMiddleware])
  .server(async ({ next, context }) => {
    const sessionCookie = getCookie("session");

    const session = await validateSessionToken(sessionCookie ?? "", context.db);

    return next({
      context: {
        session,
      },
    });
  });

export const authGuardMiddleware = createMiddleware({ type: "function" })
  .middleware([selectSessionTokenMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session) {
      throw new UnauthorizedError();
    }

    return next({
      context: {
        session: context.session,
        user: context.session.user,
      },
    });
  });

export const rateLimiterMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  if (env.NODE_ENV !== "production") {
    return await next();
  }

  const ip = getHeader("x-forwarded-for") || "localhost";

  const isValid = await rateLimiter.checkRate(ip, 1);

  if (!isValid) {
    throw new TooManyRequestsError();
  }

  return await next();
});
