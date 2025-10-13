import { env } from "~/env";
import type { CookieOptions } from "hono/utils/cookie";

export const sessionCookieConfig = {
  name: "session",
  optionsForExpiry: (expiresAt: Date): CookieOptions => {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    };
  },
  optionsForDeletion: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  } satisfies CookieOptions,
};
