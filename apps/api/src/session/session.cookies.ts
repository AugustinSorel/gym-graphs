import { env } from "~/env";
import type { CookieOptions } from "hono/utils/cookie";

export const sessionCookie = {
  name: "session",
  options: (expiresAt: Date): CookieOptions => {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    };
  },
};
