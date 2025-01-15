import { createMiddleware } from "@tanstack/start";
import { setResponseStatus } from "vinxi/http";
import { selectSessionTokenMiddleware } from "~/session/session.middlewares";

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
      },
    });
  });
