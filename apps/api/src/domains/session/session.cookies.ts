import { env } from "~/env";
import type { CookieOptions } from "hono/utils/cookie";

export const sessionCookie = {
  name: "session",
  optionsForExpiry: (expiresAt: Date): CookieOptions => {
    return {
      httpOnly: true,
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      secure: env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
      domain: env.NODE_ENV === "production" ? ".gym-graphs.com" : "localhost",
    };
  },
  optionsForDeletion: {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
    domain: env.NODE_ENV === "production" ? ".gym-graphs.com" : "localhost",
  } satisfies CookieOptions,
};
