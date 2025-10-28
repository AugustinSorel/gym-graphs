import { env } from "~/env";
import type { CookieOptions } from "hono/utils/cookie";

export const sessionCookie = {
  name: "session",
  optionsForExpiry: (expiresAt: Date): CookieOptions => {
    return {
      httpOnly: true,
      sameSite: "none",
      secure: env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    };
  },
  optionsForDeletion: {
    httpOnly: true,
    sameSite: "none",
    secure: env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  } satisfies CookieOptions,
};
