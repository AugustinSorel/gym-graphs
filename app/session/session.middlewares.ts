import { createMiddleware } from "@tanstack/start";
import { getCookie } from "vinxi/http";
import { validateSessionToken } from "~/auth/auth.services";
import { db } from "~/utils/db";

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
