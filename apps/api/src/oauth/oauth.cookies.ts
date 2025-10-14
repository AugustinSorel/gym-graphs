import type { CookieOptions } from "hono/utils/cookie";
import { env } from "~/env";

export const oauthCookies = {
  github: {
    name: "github_oauth_state",
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    } satisfies CookieOptions,
  },
};
